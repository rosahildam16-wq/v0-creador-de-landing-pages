# MVP Audit Report — Magic Funnel Platform

**Fecha:** 2026-03-04
**Rama:** `claude/check-connection-259Jn`
**Auditor:** Claude Code (AI)
**Scope:** Login/Roles/Comunidades (NO rewards/afiliados)

---

## 1. Estado de endpoints críticos

| Endpoint | Método | Estado | Notas |
|---|---|---|---|
| `/api/auth/login` | POST | ✅ OK | Multi-path auth (admin/team/DB) |
| `/api/auth/logout` | POST | ✅ OK | Borra cookie, audit log |
| `/api/auth/me` | GET | ✅ OK | Session init + bootstrap |
| `/api/admin/roles` | GET | ⚠️ FLAKY | Falla si `SUPABASE_SERVICE_ROLE_KEY` no está seteada (cae a anon key → schema cache error). Ver P0-C. |
| `/api/admin/roles` | POST | ⚠️ FLAKY | Mismo problema DB. |
| `/api/admin/roles/[id]` | DELETE | ⚠️ FLAKY | Mismo problema DB. |
| `/api/admin/communities/transfer-owner` | POST | ✅ OK | Requiere super_admin session |
| `/api/admin/communities/[id]/freeze` | POST | ✅ OK | Requiere super_admin/admin/compliance |
| `/api/admin/users` | GET/POST/PATCH/DELETE | ✅ OK | RBAC correcto |
| `/api/admin/leads` | GET | ✅ OK | Masking por rol |
| `/api/admin/dashboard` | GET | ✅ OK | Todos los roles admin |
| `/api/admin/audit` | GET | ✅ OK | Solo super_admin / compliance |
| `/api/admin/mass-email-skalia` | POST | ❌ FAIL | **Sin auth guard — endpoint abierto.** |
| `/api/communities/my-community` | GET | ✅ OK | Usa service_role key |
| `/api/communities/my-community` | PATCH | ⚠️ FLAKY | **Sin role check — cualquier miembro puede editar la comunidad.** |
| `/api/communities/route` | PATCH | ❌ FAIL | **Sin auth en absoluto.** |
| `/api/communities/login` | POST | ⚠️ FLAKY | SQL injection potencial en OR clause con passwords |
| `/api/debug/auth-health` | GET | ✅ OK | Protegido en prod con X-DEBUG-SECRET |
| `/api/debug/health` | GET | ✅ OK | Nuevo — health check simple |
| `/api/leads` | POST | ✅ OK | Lead capture público (intencional) |

---

## 2. Estado de pantallas críticas

| Pantalla | Ruta | Estado | Notas |
|---|---|---|---|
| Login | `/login` | ✅ OK | Multi-mode login/register |
| Admin Dashboard | `/admin` | ✅ OK | Requiere admin role (middleware) |
| Admin Roles | `/admin/roles` | ⚠️ FLAKY | Depende de schema cache (ver P0-C) |
| Admin Usuarios | `/admin/usuarios` | ✅ OK | |
| Admin Leads | `/admin/leads` | ✅ OK | |
| Admin Comunidades | `/admin/comunidades` | ✅ OK | |
| Admin Mailing | `/admin/mailing` | ✅ OK (tablas pueden faltar) | |
| Leader Dashboard | `/leader` | ✅ OK | |
| Leader Comunidad | `/leader/comunidad` | ⚠️ FLAKY | Posts en localStorage — no persistente |
| Leader Academia | `/leader/academia` | ✅ OK | |
| Leader Embudos | `/leader/embudos` | ✅ OK | |
| Member Area | `/member` | ✅ OK | |

> **Nota crítica resuelta en este PR:** El layout `/leader` bloqueaba usuarios con `role="leader"`, enviándolos de vuelta a `/login`. Sensei no podía entrar. **Fix aplicado.**

---

## 3. Top 10 errores priorizados

### P0 — Bloquean operación inmediata

---

#### P0-1: `leader/layout.tsx` bloquea a Sensei (role=leader)
**Causa raíz:** La condición de acceso solo permite `role === "member"` o `role === "super_admin"`. Sensei tiene `role = "leader"` en `community_members`, que es lo que el login pone en la sesión JWT. El layout lo detecta como rol inválido y redirige a `/login`.

**Evidencia:**
```typescript
// app/leader/layout.tsx línea 18 (antes del fix)
if (!isLoading && isAuthenticated &&
    user?.role !== "member" &&
    user?.role !== "super_admin") {
  router.replace("/login")  // ← Sensei llega aquí con role="leader"
}
```

**Fix:** Agregar `user?.role !== "leader"` a la condición.
**Archivos:** `app/leader/layout.tsx`
**Estado:** ✅ Corregido en este PR

---

#### P0-2: Schema cache error en `/admin/roles`
**Causa raíz:** `createAdminClient()` cae a `NEXT_PUBLIC_SUPABASE_ANON_KEY` si `SUPABASE_SERVICE_ROLE_KEY` no está definida. Con la clave anon, PostgREST no incluye `admin_roles` en su schema cache porque la tabla no tiene GRANTs a `anon`/`authenticated`.

**Evidencia:** Error en UI: `"Could not find the table 'public.admin_roles' in the schema cache"`

**Fix:**
1. Setear `SUPABASE_SERVICE_ROLE_KEY` en el entorno (principal)
2. Ejecutar en Supabase SQL Editor:
   ```sql
   -- scripts/025_fix_admin_roles_grants.sql (ya en el repo)
   NOTIFY pgrst, 'reload schema';
   ```

**Archivos:** `scripts/025_fix_admin_roles_grants.sql` (ya creado)
**Estado:** ⚠️ Migration lista — requiere ejecución en Supabase

---

#### P0-3: `/api/admin/mass-email-skalia` sin autenticación
**Causa raíz:** El endpoint no tiene ningún guard. Cualquiera que conozca la URL puede disparar un envío masivo de emails a todos los miembros con código `DIAMANTECELION`.

**Evidencia:** Archivo completo sin `requireAdminSession()`.

**Fix:** Agregar `requireAdminSession` + `requireRole(["super_admin", "admin"])`.
**Archivos:** `app/api/admin/mass-email-skalia/route.ts`
**Estado:** ✅ Corregido en este PR

---

### P1 — Deben corregirse antes de uso amplio

---

#### P1-4: `/api/communities/my-community` PATCH sin validación de rol
**Causa raíz:** El handler PATCH solo verifica que el email exista en `community_members`, pero no comprueba si el usuario tiene rol `leader` o `owner`. Cualquier miembro puede hacer PATCH con su email y editar la comunidad (nombre, color, trial_days, settings).

**Fix:** Verificar `member.role === "leader"` antes de actualizar.
**Archivos:** `app/api/communities/my-community/route.ts`
**Estado:** ✅ Corregido en este PR

---

#### P1-5: `/api/communities` PATCH sin ninguna autenticación
**Causa raíz:** El handler PATCH en `app/api/communities/route.ts` no valida sesión ni rol. Cualquiera puede actualizar `settings` de cualquier comunidad con solo saber su `id`.

**Fix:** Añadir validación de sesión de admin.
**Archivos:** `app/api/communities/route.ts`
**Estado:** ✅ Corregido en este PR

---

#### P1-6: SQL injection potencial en `/api/communities/login`
**Causa raíz:** El handler construye filtros PostgREST con interpolación directa de strings:
```typescript
.or(`email.eq."${normalizedEmail}",username.eq."${normalizedEmail}"`)
.or(`password_hash.eq."${password}",password_plain.eq."${password}"`)
```
Un input como `test",email.ilike."%` podría alterar el filtro.

**Fix (P1):** Usar `.eq()` encadenado en vez de `.or()` con strings interpolados.
**Archivos:** `app/api/communities/login/route.ts`
**Estado:** ⚠️ Pendiente (fuera del scope P0 de este PR)

---

#### P1-7: `app/api/communities/my-community` — cliente Supabase a nivel de módulo
**Causa raíz:** El cliente Supabase se instancia al cargar el módulo (`const supabase = createClient(...)`), no dentro de la función handler. En entornos serverless con cold starts largos, la conexión puede quedar stale.

**Fix:** Mover `createClient(...)` dentro de cada handler.
**Archivos:** `app/api/communities/my-community/route.ts`
**Estado:** ✅ Corregido en este PR (se migró a `createAdminClient()` dentro de handlers)

---

### P2 — Deuda técnica / mejoras

---

#### P2-8: `next.config.mjs` — `ignoreBuildErrors: true`
**Causa raíz:** TypeScript errors no bloquean el build. Errores de tipo silenciosos pueden llegar a producción.
**Fix:** Quitar la opción (o cambiar a `false`) y corregir los type errors reales.
**Estado:** ⏸️ Postergado (requiere auditoría de tipos completa)

---

#### P2-9: Comunidad posts en `localStorage`
**Causa raíz:** `app/leader/comunidad/page.tsx` persiste los posts en `localStorage`. No son compartidos entre usuarios ni son persistentes entre dispositivos.
**Fix:** Migrar a tabla `community_posts` en Supabase.
**Estado:** ⏸️ Feature work — fuera del scope P0

---

#### P2-10: Contraseñas hardcodeadas en `/api/auth/login`
**Causa raíz:** `ADMIN_PASSWORD = "Leon321$#"`, `MEMBER_DEFAULT_PASSWORD = "Member123$"`, y `LAUNCH_TEST_CODE = "LANZAMIENTO2026"` están en el código fuente.
**Fix:** Mover a variables de entorno; eliminar bypass de test.
**Estado:** ⏸️ Postergado (requiere coordinación con equipo)

---

## 4. Acciones de BD pendientes (ejecutar en Supabase)

```sql
-- 1. Aplicar grants para fix schema cache (copiar de scripts/025_fix_admin_roles_grants.sql)
-- 2. Recargar schema de PostgREST inmediatamente:
NOTIFY pgrst, 'reload schema';

-- 3. Verificar que Sensei tiene role=leader en community_members:
SELECT member_id, username, email, role, community_id
FROM community_members WHERE username = 'sensei';

-- 4. Si Sensei no tiene community_id = 'skalia-vip', actualizar:
-- UPDATE community_members SET community_id = 'skalia-vip', role = 'leader'
-- WHERE username = 'sensei';
```

---

## 5. Variables de entorno requeridas

| Variable | Uso | Estado |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | ✅ Debe estar seteada |
| `SUPABASE_SERVICE_ROLE_KEY` | Acceso admin a DB (bypasa RLS) | ⚠️ **Crítica — sin esto admin_roles falla** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fallback (no usar para admin) | ✅ |
| `JWT_SECRET` | Firma de cookies de sesión | ⚠️ Si no está, usa fallback inseguro |
| `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` | Email del super admin | ✅ Default a iajorgeleon21@gmail.com |
| `DEBUG_SECRET` | Header para /api/debug/auth-health en prod | Opcional |
| `RESEND_API_KEY` | Envío de emails | ✅ Para mailing |
