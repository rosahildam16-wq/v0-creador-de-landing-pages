# Smoke Tests — Sistema de Invitaciones Universal

Ejecutar contra la URL base: `BASE=https://tu-dominio.com`

---

## 1. Crear comunidad de prueba (Supabase SQL)

```sql
INSERT INTO public.communities (id, nombre, slug, color, activa, free_trial_days)
VALUES ('test-community', 'Test Community', 'test-community', '#22d3ee', true, 7)
ON CONFLICT (id) DO NOTHING;
```

---

## 2. Crear invite via API

```bash
# Como miembro con plan activo
curl -s -X POST $BASE/api/invites \
  -H "Content-Type: application/json" \
  -d '{
    "email": "karen@ejemplo.com",
    "community_id": "test-community",
    "max_uses": 10
  }' | jq .

# Resultado esperado:
# {
#   "success": true,
#   "invite": {
#     "token": "karen-xxxxxx",
#     "community_id": "test-community",
#     "invite_url": "https://tu-dominio.com/join/test-community?token=karen-xxxxxx",
#     "uses": 0,
#     "max_uses": 10
#   }
# }
```

**Verificar en DB:**
```sql
SELECT token, community_id, sponsor_username, uses, max_uses, is_active
FROM community_invites
WHERE sponsor_username = 'karen';
```

---

## 3. Validar token via API

```bash
TOKEN="karen-xxxxxx"  # usar token del paso anterior

curl -s $BASE/api/invites/$TOKEN | jq .

# Resultado esperado:
# {
#   "valid": true,
#   "invite": { "token": "karen-xxxxxx", "community_id": "test-community", "sponsor_username": "karen" },
#   "community": { "id": "test-community", "nombre": "Test Community", "slug": "test-community" },
#   "sponsor": { "username": "karen", "name": "Karen Lopez" }
# }
```

---

## 4. Registrar usuario vía invite_token

```bash
TOKEN="karen-xxxxxx"

curl -s -X POST $BASE/api/join/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Usuario Prueba\",
    \"email\": \"prueba-$(date +%s)@test.com\",
    \"password\": \"test123\",
    \"username\": \"prueba$(date +%s)\",
    \"communitySlug\": \"test-community\",
    \"invite_token\": \"$TOKEN\"
  }" | jq .

# Resultado esperado:
# {
#   "success": true,
#   "communityId": "test-community",
#   "communityName": "Test Community",
#   "communitySlug": "test-community"
# }
```

---

## 5. Verificar sponsor y community_id en DB

```sql
-- El miembro debe estar en la comunidad correcta con el sponsor correcto
SELECT member_id, username, community_id, sponsor_username, activo, trial_ends_at
FROM community_members
WHERE username = 'prueba<timestamp>'
  AND community_id = 'test-community'
  AND sponsor_username = 'karen';
-- Debe devolver 1 fila

-- El invite debe haber incrementado uses
SELECT token, uses, max_uses
FROM community_invites
WHERE token = 'karen-xxxxxx';
-- uses debe ser 1
```

---

## 6. Crear lead desde funnel con invite_token

```bash
TOKEN="karen-xxxxxx"

curl -s -X POST $BASE/api/leads \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"Lead de Prueba\",
    \"correo\": \"lead-$(date +%s)@test.com\",
    \"whatsapp\": \"+573001234567\",
    \"embudo_id\": \"franquicia-reset\",
    \"invite_token\": \"$TOKEN\"
  }" | jq .

# Resultado esperado: { "success": true, ... }
```

**Verificar lead.community_id:**
```sql
SELECT id, nombre, asignado_a, community_id
FROM leads
WHERE email LIKE 'lead-%@test.com'
ORDER BY fecha_ingreso DESC
LIMIT 1;
-- community_id debe ser 'test-community'
-- asignado_a debe ser 'karen'
```

---

## 7. Verificar UI — comunidad aparece en dashboard

1. Hacer login como `prueba<timestamp>@test.com`
2. Ir a `/member/comunidad`
3. **Debe mostrar "Test Community"** sin pedir upgrade ni código
4. NO debe mostrar "Crea tu propio imperio" ni prompt de plan

---

## 8. Listar invites del miembro

```bash
curl -s "$BASE/api/invites?email=karen@ejemplo.com" | jq '.invites[] | {token, uses, max_uses, invite_url}'
```

---

## 9. Desactivar invite

```bash
INVITE_ID="uuid-del-invite"
curl -s -X DELETE "$BASE/api/invites?id=$INVITE_ID&email=karen@ejemplo.com" | jq .
# { "success": true }

# Verificar que ya no es válido
curl -s $BASE/api/invites/$TOKEN | jq .
# { "valid": false, "error": "Esta invitación ya no está activa" }
```

---

## 10. Test de token expirado

```sql
UPDATE community_invites
SET expires_at = now() - interval '1 hour'
WHERE token = 'karen-xxxxxx';
```

```bash
curl -s $BASE/api/invites/karen-xxxxxx | jq .
# { "valid": false, "error": "Esta invitación ha expirado" }
```

---

## 11. Test de max_uses alcanzado

```sql
UPDATE community_invites
SET uses = max_uses
WHERE token = 'karen-xxxxxx' AND max_uses > 0;
```

```bash
curl -s $BASE/api/invites/karen-xxxxxx | jq .
# { "valid": false, "error": "Esta invitación ha alcanzado su límite de usos" }
```

---

## 12. Limpieza post-tests

```sql
DELETE FROM community_members WHERE username LIKE 'prueba%';
DELETE FROM leads WHERE email LIKE 'lead-%@test.com';
DELETE FROM community_invites WHERE sponsor_username = 'karen' AND token LIKE 'karen-%';
DELETE FROM communities WHERE id = 'test-community';
```

---

## Checklist de validación

- [ ] Invite se crea correctamente con token único
- [ ] `GET /api/invites/[token]` devuelve `valid: true` con datos completos
- [ ] Registro via invite_token asigna `community_id` correcto
- [ ] Registro via invite_token asigna `sponsor_username` correcto
- [ ] `uses` se incrementa tras registro exitoso
- [ ] Lead creado desde funnel con invite_token tiene `community_id` correcto
- [ ] Lead creado desde funnel con invite_token tiene `asignado_a` = sponsor
- [ ] Dashboard muestra comunidad sin pedir upgrade
- [ ] Token expirado devuelve error 410
- [ ] Token con max_uses alcanzado devuelve error 410
- [ ] Invite desactivado devuelve error
- [ ] Miembro sin plan 47+ recibe error al intentar crear invite
