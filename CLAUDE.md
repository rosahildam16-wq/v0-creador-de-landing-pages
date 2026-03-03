# Magic Funnel App - Guía de Desarrollo

Proyecto de creación de landing pages basado en Next.js, Supabase y CRM integrado.

## Comandos Útiles
- `npm run dev`: Inicia el servidor de desarrollo con Turbo.
- `npm run build`: Genera la versión de producción.
- `npm run lint`: Ejecuta el linter para revisar errores de código.

## Guía de Estilo y Convenciones
- **Framework**: Next.js 14 con App Router (directorio `app/`).
- **Componentes**: React con TypeScript. Usar componentes de Radix UI (en `components/ui/`) para elementos básicos de interfaz.
- **Estilos**: Tailwind CSS. Seguir el sistema de diseño definido en `tailwind.config.ts`.
- **Base de Datos**: Supabase. Las interacciones deben usar `@supabase/ssr` para autenticación y estado del servidor.
- **Iconos**: Utilizar `lucide-react`.
- **Animaciones**: Utilizar `framer-motion`.

## Estructura de Directorios
- `app/`: Rutas, layouts y páginas de la aplicación.
- `components/`: Componentes reutilizables de React.
- `lib/`: Utilidades, configuraciones de clientes (Supabase, OpenAI, etc.) y funciones auxiliares.
- `hooks/`: Custom hooks de React.
- `public/`: Activos estáticos como imágenes y logos.
- `scripts/`: Scripts de mantenimiento y migraciones SQL.

## Notas de Configuración
- El proyecto utiliza variables de entorno definidas en `.env.local` para integraciones con Supabase, OpenAI, Resend y Google APIs.
- Las migraciones y correcciones de base de datos se encuentran en el directorio `scripts/`.
