# Migración: sistema de invites + corrección de community_id

## Contexto

Antes de este PR, los miembros y leads podían quedar asignados a
`community_id = 'general'` en lugar de `'skalia-vip'` cuando:

- El sponsor era encontrado por la lista estática `TEAM_MEMBERS` (e.g. "sensei").
- El usuario se registraba con el código `DIAMANTECELION` pero sin sponsor real.
- El lead era captado desde un embudo de un miembro estático.

Este script SQL corrige los datos históricos y crea la nueva tabla
`community_invites`.

---

## Paso 1 — Crear tabla `community_invites`

Ejecutar en Supabase SQL Editor:

```sql
-- Copiar el contenido de scripts/030_create_community_invites.sql
```

O directamente:

```sql
CREATE TABLE IF NOT EXISTS public.community_invites (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT        UNIQUE NOT NULL,
  community_id  TEXT        NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'member',
  sponsor_username TEXT     NULL,
  max_uses      INT         NOT NULL DEFAULT 0,
  uses          INT         NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NULL,
  created_by    TEXT        NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_select_all"   ON public.community_invites FOR SELECT USING (true);
CREATE POLICY "invites_insert_admin" ON public.community_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "invites_update_admin" ON public.community_invites FOR UPDATE USING (true);
CREATE POLICY "invites_delete_admin" ON public.community_invites FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_community_invites_token ON public.community_invites(token);

-- Invite permanente para sensei (sin límite de usos)
INSERT INTO public.community_invites (token, community_id, role, sponsor_username, max_uses, created_by)
VALUES ('skalia-sensei', 'skalia-vip', 'member', 'sensei', 0, 'sensei')
ON CONFLICT (token) DO NOTHING;
```

---

## Paso 2 — Migrar members que quedaron en "general"

Mover a `skalia-vip` a los miembros que:

- Tienen `sponsor_username = 'sensei'` (patrocinados por sensei), **o**
- Se registraron con el código `DIAMANTECELION`, **o**
- Su `community_id` actual es `'general'` y tienen sponsor conocido.

```sql
-- Ver afectados antes de actualizar
SELECT id, name, username, community_id, sponsor_username, discount_code
FROM public.community_members
WHERE community_id = 'general'
  AND (
    sponsor_username = 'sensei'
    OR discount_code = 'DIAMANTECELION'
  );

-- Ejecutar migración
UPDATE public.community_members
SET community_id = 'skalia-vip'
WHERE community_id = 'general'
  AND (
    sponsor_username = 'sensei'
    OR discount_code = 'DIAMANTECELION'
  );
```

---

## Paso 3 — Migrar leads que quedaron en "general"

Leads cuyo `asignado_a` corresponde a un miembro de Skalia VIP pero quedaron
en `community_id = 'general'`.

```sql
-- Ver leads afectados
SELECT l.id, l.nombre, l.asignado_a, l.community_id
FROM public.leads l
WHERE l.community_id = 'general'
  AND l.asignado_a IN (
    SELECT username FROM public.community_members WHERE community_id = 'skalia-vip'
    UNION
    SELECT member_id FROM public.community_members WHERE community_id = 'skalia-vip'
  );

-- Ejecutar migración
UPDATE public.leads l
SET community_id = 'skalia-vip'
WHERE l.community_id = 'general'
  AND l.asignado_a IN (
    SELECT username FROM public.community_members WHERE community_id = 'skalia-vip'
    UNION
    SELECT member_id FROM public.community_members WHERE community_id = 'skalia-vip'
  );

-- También migrar leads cuyo asignado_a sea 'sensei' (estático)
UPDATE public.leads
SET community_id = 'skalia-vip'
WHERE community_id = 'general'
  AND asignado_a = 'sensei';
```

---

## Paso 4 — Verificación post-migración

```sql
-- Cuántos members quedaron en "general" vs "skalia-vip"
SELECT community_id, COUNT(*) AS total
FROM public.community_members
GROUP BY community_id;

-- Cuántos leads quedan aún en "general" con sponsor de Skalia
SELECT COUNT(*) AS leads_sin_migrar
FROM public.leads
WHERE community_id = 'general'
  AND asignado_a IN (
    SELECT username FROM public.community_members WHERE community_id = 'skalia-vip'
  );

-- Invites creados
SELECT token, community_id, sponsor_username, uses, max_uses, expires_at
FROM public.community_invites;
```

---

## Smoke test del nuevo flujo de invites

### 1. Crear invite (desde admin o SQL)

```sql
INSERT INTO public.community_invites (token, community_id, role, sponsor_username, max_uses, created_by)
VALUES ('test-karen', 'skalia-vip', 'member', 'karen', 10, 'karen');
```

### 2. Validar invite via API

```bash
curl https://tu-dominio.com/api/invites/test-karen
# Esperado: { "valid": true, "community": { "id": "skalia-vip", ... } }
```

### 3. Registrar usuario con invite_token

```bash
curl -X POST https://tu-dominio.com/api/communities/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Usuario Test",
    "email": "test@ejemplo.com",
    "password": "test123",
    "username": "usuariotest",
    "invite_token": "test-karen"
  }'
# Esperado: { "success": true, "communityId": "skalia-vip", ... }
```

### 4. Verificar en DB

```sql
SELECT member_id, community_id, sponsor_username, discount_code
FROM public.community_members
WHERE username = 'usuariotest';
-- community_id debe ser 'skalia-vip', sponsor_username debe ser 'karen'

SELECT uses FROM public.community_invites WHERE token = 'test-karen';
-- uses debe ser 1
```

### 5. Verificar que aparece Skalia en el dashboard

- Hacer login como `test@ejemplo.com`
- Ir a `/member/comunidad`
- Debe mostrar "Skalia VIP" sin pedir upgrade

---

## Notas

- El token `DIAMANTECELION` como `discountCode` sigue funcionando como fallback para usuarios existentes.
- El campo `invite_token` en `POST /api/leads` permite que formularios de embudos pasen el token para atribuir leads correctamente.
- Los links de invitación quedan como: `https://tu-dominio.com/registro?invite=skalia-sensei`
