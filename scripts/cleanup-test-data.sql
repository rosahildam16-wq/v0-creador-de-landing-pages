-- ============================================================
-- CLEANUP: Datos de prueba + corrección de owner Skalia VIP
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. COMUNIDADES: corregir Skalia VIP + eliminar comunidades extra
-- ============================================================

-- Actualizar Skalia VIP: código de acceso correcto + owner Sensei
UPDATE communities
SET
    codigo       = 'DIAMANTECELIONVIP',
    leader_email = 'jlmarketing9011@gmail.com',
    leader_name  = 'Jorge León',
    activa       = true
WHERE id = 'skalia-vip';

-- Eliminar todas las comunidades que NO sean skalia-vip ni general
DELETE FROM communities
WHERE id NOT IN ('skalia-vip', 'general');

-- ============================================================
-- 2. COMMUNITY MEMBERS: eliminar socios de prueba
-- ============================================================

-- Eliminar miembros de prueba (Elena, Ricardo, Sofía)
DELETE FROM community_members
WHERE email IN (
    'elena@correo.com',
    'ricardo@correo.com',
    'sofia@correo.com'
)
OR member_id IN ('socio-1', 'socio-2', 'socio-3');

-- ============================================================
-- 3. LEADS: identificar y eliminar leads de prueba
-- ============================================================

-- Vista previa de lo que se va a borrar (ejecuta primero para verificar)
-- SELECT id, nombre, email, whatsapp, campana, asignado_a, community_id, created_at
-- FROM leads
-- WHERE
--     LOWER(nombre)    LIKE '%test%'
--     OR LOWER(nombre) LIKE '%mint%'
--     OR LOWER(nombre) LIKE '%prueba%'
--     OR LOWER(email)  LIKE '%test%'
--     OR LOWER(email)  LIKE '%mint%'
--     OR LOWER(email)  LIKE '%prueba%'
--     OR LOWER(whatsapp) LIKE '%000000%'
--     OR asignado_a IN ('elena@correo.com', 'ricardo@correo.com', 'sofia@correo.com',
--                       'elena', 'ricardo', 'sofia', 'socio-1', 'socio-2', 'socio-3')
-- ORDER BY created_at;

-- Guardar IDs de leads a eliminar en CTE para limpiar datos relacionados
WITH leads_a_eliminar AS (
    SELECT id FROM leads
    WHERE
        LOWER(nombre)    LIKE '%test%'
        OR LOWER(nombre) LIKE '%mint%'
        OR LOWER(nombre) LIKE '%prueba%'
        OR LOWER(email)  LIKE '%test%'
        OR LOWER(email)  LIKE '%mint%'
        OR LOWER(email)  LIKE '%prueba%'
        OR LOWER(whatsapp) LIKE '%000000%'
        OR asignado_a IN (
            'elena@correo.com', 'ricardo@correo.com', 'sofia@correo.com',
            'elena', 'ricardo', 'sofia', 'socio-1', 'socio-2', 'socio-3'
        )
)
-- Eliminar form_submissions de esos leads (si existe la tabla)
DELETE FROM form_submissions
WHERE lead_id IN (SELECT id FROM leads_a_eliminar);

-- Limpiar respuestas de formularios de esos leads
WITH leads_a_eliminar AS (
    SELECT id FROM leads
    WHERE
        LOWER(nombre)    LIKE '%test%'
        OR LOWER(nombre) LIKE '%mint%'
        OR LOWER(nombre) LIKE '%prueba%'
        OR LOWER(email)  LIKE '%test%'
        OR LOWER(email)  LIKE '%mint%'
        OR LOWER(email)  LIKE '%prueba%'
        OR LOWER(whatsapp) LIKE '%000000%'
        OR asignado_a IN (
            'elena@correo.com', 'ricardo@correo.com', 'sofia@correo.com',
            'elena', 'ricardo', 'sofia', 'socio-1', 'socio-2', 'socio-3'
        )
)
DELETE FROM form_answers
WHERE submission_id IN (
    SELECT id FROM form_submissions
    WHERE lead_id IN (SELECT id FROM leads_a_eliminar)
);

-- Finalmente eliminar los leads de prueba
DELETE FROM leads
WHERE
    LOWER(nombre)    LIKE '%test%'
    OR LOWER(nombre) LIKE '%mint%'
    OR LOWER(nombre) LIKE '%prueba%'
    OR LOWER(email)  LIKE '%test%'
    OR LOWER(email)  LIKE '%mint%'
    OR LOWER(email)  LIKE '%prueba%'
    OR LOWER(whatsapp) LIKE '%000000%'
    OR asignado_a IN (
        'elena@correo.com', 'ricardo@correo.com', 'sofia@correo.com',
        'elena', 'ricardo', 'sofia', 'socio-1', 'socio-2', 'socio-3'
    );

-- ============================================================
-- 4. APPOINTMENTS / CITAS: limpiar citas de los socios de prueba
-- ============================================================

DELETE FROM appointments
WHERE member_email IN (
    'elena@correo.com', 'ricardo@correo.com', 'sofia@correo.com'
)
OR member_id IN ('socio-1', 'socio-2', 'socio-3');

-- ============================================================
-- 5. VERIFICACIÓN FINAL
-- ============================================================

-- Muestra estado después de la limpieza:
SELECT 'communities' AS tabla, COUNT(*) AS registros FROM communities
UNION ALL
SELECT 'community_members', COUNT(*) FROM community_members
UNION ALL
SELECT 'leads', COUNT(*) FROM leads;
