# Smoke Test Plan — Magic Funnel MVP
> Automatizable con curl / Playwright. Ejecutar en orden.

**BASE_URL** = `https://tu-dominio.com` (o `http://localhost:3000` en dev)

---

## 0. Pre-flight (una vez antes de todo)

```sql
-- Ejecutar en Supabase SQL Editor:
-- a) Aplicar grants (si no se ha hecho):
-- (pegar contenido de scripts/025_fix_admin_roles_grants.sql)

-- b) Recargar schema PostgREST:
NOTIFY pgrst, 'reload schema';

-- c) Verificar estado de Sensei:
SELECT member_id, username, email, role, community_id
FROM community_members WHERE username = 'sensei';
-- Esperado: role='leader', community_id='skalia-vip'

-- d) Verificar Skalia VIP:
SELECT id, nombre, owner_username FROM communities WHERE id = 'skalia-vip';
-- Esperado: owner_username='sensei'
```

---

## 1. Health checks

```bash
# T1.1 — Health básico
curl -s "$BASE_URL/api/debug/health" | jq .
# Esperado: { "ok": true, "db": "connected", ... }

# T1.2 — Auth health (dev — sin header requerido)
curl -s "$BASE_URL/api/debug/auth-health" | jq .
# Esperado: key_in_use='service_role', admin_roles='✅ exists'
# Si key_in_use='anon_fallback ⚠️': setear SUPABASE_SERVICE_ROLE_KEY

# T1.3 — Auth health en producción
curl -s -H "X-DEBUG-SECRET: $DEBUG_SECRET" "$BASE_URL/api/debug/auth-health" | jq .
```

---

## 2. Login / Sesión

```bash
# T2.1 — Login super admin
RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"iajorgeleon21@gmail.com","password":"Leon321$#"}')
echo $RESPONSE | jq .
# Esperado: { "success": true, "role": "super_admin", "email": "iajorgeleon21@gmail.com" }
# Cookie mf_session debe quedar en /tmp/cookies.txt

# T2.2 — Verificar sesión después de login
curl -s -b /tmp/cookies.txt "$BASE_URL/api/auth/me" | jq .
# Esperado: { "authenticated": true, "user": { "role": "super_admin", ... } }

# T2.3 — Login Sensei
RESPONSE_SENSEI=$(curl -s -c /tmp/cookies_sensei.txt -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jlmarketing9011@gmail.com","password":"Member123$"}')
echo $RESPONSE_SENSEI | jq .
# Esperado: { "success": true, "role": "leader" }

# T2.4 — Logout
curl -s -b /tmp/cookies.txt -X POST "$BASE_URL/api/auth/logout" | jq .
# Esperado: { "success": true }

# T2.5 — Sesión inválida post-logout
curl -s -b /tmp/cookies.txt "$BASE_URL/api/auth/me" | jq .
# Esperado: { "authenticated": false } — status 401
```

---

## 3. Bootstrap super_admin

```bash
# T3.1 — Login super admin (llama bootstrap automáticamente)
curl -s -c /tmp/cookies_sa.txt -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"iajorgeleon21@gmail.com","password":"Leon321$#"}' | jq .

# T3.2 — Verificar en Supabase que existe el rol (desde SQL Editor):
# SELECT * FROM admin_roles WHERE role='super_admin' AND active=true;
# Esperado: 1 fila con user_id='iajorgeleon21@gmail.com', granted_by='bootstrap'

# T3.3 — GET /api/admin/roles (verificar que aparece el super_admin en UI)
curl -s -b /tmp/cookies_sa.txt "$BASE_URL/api/admin/roles" | jq '.roles | length'
# Esperado: >= 1

# T3.4 — Idempotencia: llamar /api/auth/me de nuevo no duplica el rol
curl -s -b /tmp/cookies_sa.txt "$BASE_URL/api/auth/me" | jq .role
# Verificar en DB que sigue siendo 1 fila (no duplicados)
```

---

## 4. Admin Roles (P0.C)

```bash
# T4.1 — Listar roles (debe funcionar sin error schema cache)
curl -s -b /tmp/cookies_sa.txt "$BASE_URL/api/admin/roles" | jq .
# Esperado: { "roles": [ { "id": "...", "role": "super_admin", "active": true, ... } ] }
# Si aparece "schema cache": ejecutar paso 0 (NOTIFY pgrst)

# T4.2 — Acceso denegado sin sesión admin
curl -s "$BASE_URL/api/admin/roles" | jq .
# Esperado: { "error": "No autenticado" } — status 401

# T4.3 — Acceso denegado para sesión non-admin
curl -s -b /tmp/cookies_sensei.txt "$BASE_URL/api/admin/roles" | jq .
# Esperado: { "error": "Acceso denegado" } — status 403
```

---

## 5. Comunidad Skalia VIP (Sensei)

```bash
# T5.1 — Login Sensei (re-login fresco)
curl -s -c /tmp/cookies_sensei.txt -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jlmarketing9011@gmail.com","password":"Member123$"}' | jq .
# Esperado: { "success": true, "role": "leader" }

# T5.2 — Ver comunidad de Sensei
curl -s -b /tmp/cookies_sensei.txt \
  "$BASE_URL/api/communities/my-community?email=jlmarketing9011@gmail.com" | jq '.community.nombre'
# Esperado: "Skalia VIP"

# T5.3 — Verificar owner
curl -s -b /tmp/cookies_sensei.txt \
  "$BASE_URL/api/communities/my-community?email=jlmarketing9011@gmail.com" | jq '.community.owner_username'
# Esperado: "sensei"

# T5.4 — Editar comunidad (solo leaders pueden)
curl -s -b /tmp/cookies_sensei.txt -X PATCH "$BASE_URL/api/communities/my-community" \
  -H "Content-Type: application/json" \
  -d '{"email":"jlmarketing9011@gmail.com","color":"#9333ea"}' | jq .
# Esperado: { "success": true }

# T5.5 — Miembro NO puede editar comunidad
curl -s -c /tmp/cookies_member.txt -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test_member@magic.com","password":"test1234"}' > /dev/null
curl -s -b /tmp/cookies_member.txt -X PATCH "$BASE_URL/api/communities/my-community" \
  -H "Content-Type: application/json" \
  -d '{"email":"test_member@magic.com","color":"#ff0000"}' | jq .
# Esperado: { "error": "Se requiere rol leader para editar la comunidad" } — status 403

# T5.6 — Transfer owner (super admin)
curl -s -b /tmp/cookies_sa.txt -X POST "$BASE_URL/api/admin/communities/transfer-owner" \
  -H "Content-Type: application/json" \
  -d '{"communityIdOrSlugOrNombre":"Skalia VIP","newOwnerUsername":"sensei"}' | jq .
# Esperado: { "ok": true, "community": { "owner_username": "sensei" } }
```

---

## 6. Protección de rutas admin

```bash
# T6.1 — /admin/* sin sesión debe redirigir (desde browser) o dar 307
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/admin"
# Esperado: 307 (redirect a /login)

# T6.2 — mass-email ahora protegido (antes abierto)
curl -s -X POST "$BASE_URL/api/admin/mass-email-skalia" | jq .
# Esperado: { "error": "No autenticado" } — status 401

# T6.3 — mass-email con sesión non-admin
curl -s -b /tmp/cookies_sensei.txt -X POST "$BASE_URL/api/admin/mass-email-skalia" | jq .
# Esperado: { "error": "Acceso denegado" } — status 403

# T6.4 — mass-email con sesión super_admin
curl -s -b /tmp/cookies_sa.txt -X POST "$BASE_URL/api/admin/mass-email-skalia" | jq .
# Esperado: { "success": true, "sent": N, ... }
```

---

## 7. Lead capture (embudos)

```bash
# T7.1 — Captura pública de lead
curl -s -X POST "$BASE_URL/api/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Lead",
    "correo": "test-smoke@example.com",
    "whatsapp": "+573001234567",
    "embudo_id": "nomada-vip",
    "fuente": "Organico"
  }' | jq .
# Esperado: { "success": true, "lead_id": "...", "embudo_id": "nomada-vip" }

# T7.2 — Verificar lead en admin
curl -s -b /tmp/cookies_sa.txt "$BASE_URL/api/admin/leads?limit=1" | jq '.leads[0].nombre'
# Esperado: "Test Lead" (u otro lead reciente)
```

---

## 8. Email marketing básico

```bash
# T8.1 — Listar secuencias (puede retornar [] si tabla no existe aún)
curl -s -b /tmp/cookies_sa.txt "$BASE_URL/api/mailing/sequences" | jq 'length'
# Esperado: número >= 0 (no 500)

# T8.2 — Stats de enrollments
curl -s "$BASE_URL/api/mailing/process-sequences?stats=true" | jq .
# Esperado: { "stats": { "total": N } }
```

---

## 9. Checklist para equipo (manual)

- [ ] Login con `iajorgeleon21@gmail.com` → llega a `/admin`
- [ ] `/admin/roles` → muestra super_admin, sin error de schema cache
- [ ] `/admin/roles` → botón "Otorgar rol" funciona
- [ ] `/admin/comunidades` → Skalia VIP aparece con owner_username=sensei
- [ ] Login con `jlmarketing9011@gmail.com` (Sensei) → llega a `/leader` (NO redirige a login)
- [ ] `/leader/comunidad` → muestra "Skalia VIP" como comunidad de Sensei
- [ ] `/leader/embudos` → carga sin 500
- [ ] `/leader/leads` → carga sin 500
- [ ] `/leader/academia` → carga sin 500
- [ ] Registro de usuario nuevo → aparece en `/admin/usuarios`
- [ ] Lead capture desde `/funnel` → aparece en `/admin/leads`
- [ ] `/admin/mailing` → carga sin crash (aunque esté vacío)
- [ ] Logout → redirige a `/login`, sesión destruida
