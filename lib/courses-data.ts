export interface Lesson {
  id: string
  titulo: string
  descripcion: string
  duracion: string // e.g. "12:30"
  videoUrl?: string
  orden: number
  completado?: boolean
}

export interface Module {
  id: string
  titulo: string
  orden: number
  lecciones: Lesson[]
}

export interface Course {
  id: string
  titulo: string
  descripcion: string
  instructor: string
  categoria: string
  thumbnail: string
  banner?: string
  duracionTotal: string
  totalLecciones: number
  modulos: Module[]
  destacado?: boolean
  nivel: "basico" | "intermedio" | "avanzado"
  tags: string[]
  communityId?: string[] // If undefined, visible to all
}

export const CATEGORIES = [
  "Todos",
  "Marketing Digital",
  "Ventas",
  "Liderazgo",
  "Redes Sociales",
  "Mindset",
  "Crecimiento Personal",
]

export const COURSES: Course[] = [
  {
    id: "prospeccion-digital",
    titulo: "Prospeccion Digital Avanzada",
    descripcion: "Aprende las tecnicas mas efectivas para encontrar y conectar con prospectos de alta calidad en redes sociales. Domina Instagram, Facebook y TikTok como canales de prospeccion.",
    instructor: "Jorge Leon",
    categoria: "Marketing Digital",
    thumbnail: "/images/courses/prospeccion.jpg",
    banner: "/images/courses/prospeccion-banner.jpg",
    duracionTotal: "4h 30m",
    totalLecciones: 12,
    destacado: true,
    nivel: "intermedio",
    tags: ["prospeccion", "redes sociales", "instagram"],
    modulos: [
      {
        id: "mod-1",
        titulo: "Fundamentos de la Prospeccion",
        orden: 1,
        lecciones: [
          { id: "l-1-1", titulo: "Que es la prospeccion digital", descripcion: "Conceptos clave", duracion: "15:00", orden: 1 },
          { id: "l-1-2", titulo: "Tu avatar de cliente ideal", descripcion: "Define tu prospecto perfecto", duracion: "20:00", orden: 2 },
          { id: "l-1-3", titulo: "Plataformas y canales", descripcion: "Donde encontrar prospectos", duracion: "18:00", orden: 3 },
        ],
      },
      {
        id: "mod-2",
        titulo: "Estrategias en Instagram",
        orden: 2,
        lecciones: [
          { id: "l-2-1", titulo: "Optimiza tu perfil", descripcion: "Perfil que atrae prospectos", duracion: "22:00", orden: 1 },
          { id: "l-2-2", titulo: "Mensajes que convierten", descripcion: "Scripts probados de DM", duracion: "25:00", orden: 2 },
          { id: "l-2-3", titulo: "Stories que venden", descripcion: "Contenido estrategico", duracion: "20:00", orden: 3 },
        ],
      },
      {
        id: "mod-3",
        titulo: "Automatizacion y Escala",
        orden: 3,
        lecciones: [
          { id: "l-3-1", titulo: "Herramientas de automatizacion", descripcion: "Ahorra tiempo prospectando", duracion: "30:00", orden: 1 },
          { id: "l-3-2", titulo: "Embudos de prospeccion", descripcion: "Sistemas automaticos", duracion: "25:00", orden: 2 },
          { id: "l-3-3", titulo: "Metricas y KPIs", descripcion: "Mide tu rendimiento", duracion: "18:00", orden: 3 },
        ],
      },
    ],
  },
  {
    id: "cierre-ventas",
    titulo: "Cierre de Ventas en Network Marketing",
    descripcion: "Domina el arte del cierre. Desde la primera llamada hasta el si definitivo. Tecnicas probadas que multiplican tu tasa de conversion.",
    instructor: "Jorge Leon",
    categoria: "Ventas",
    thumbnail: "/images/courses/ventas.jpg",
    duracionTotal: "3h 15m",
    totalLecciones: 9,
    destacado: false,
    nivel: "avanzado",
    tags: ["ventas", "cierre", "llamadas"],
    modulos: [
      {
        id: "cv-mod-1",
        titulo: "Psicologia del Cierre",
        orden: 1,
        lecciones: [
          { id: "cv-1-1", titulo: "Entendiendo al prospecto", descripcion: "Que motiva la decision", duracion: "20:00", orden: 1 },
          { id: "cv-1-2", titulo: "Objeciones mas comunes", descripcion: "Como manejarlas", duracion: "25:00", orden: 2 },
          { id: "cv-1-3", titulo: "El momento del cierre", descripcion: "Cuando y como pedir la venta", duracion: "18:00", orden: 3 },
        ],
      },
      {
        id: "cv-mod-2",
        titulo: "Scripts de Cierre",
        orden: 2,
        lecciones: [
          { id: "cv-2-1", titulo: "Script de primera llamada", descripcion: "Genera confianza rapido", duracion: "22:00", orden: 1 },
          { id: "cv-2-2", titulo: "Script de seguimiento", descripcion: "Mantiene el interes", duracion: "20:00", orden: 2 },
          { id: "cv-2-3", titulo: "Cierre por WhatsApp", descripcion: "Mensajes que convierten", duracion: "25:00", orden: 3 },
        ],
      },
    ],
  },
  {
    id: "liderazgo-equipo",
    titulo: "Liderazgo y Gestion de Equipos",
    descripcion: "Construye y lidera un equipo imparable. Aprende a motivar, capacitar y duplicar tu organizacion de network marketing.",
    instructor: "Jorge Leon",
    categoria: "Liderazgo",
    thumbnail: "/images/courses/liderazgo.jpg",
    duracionTotal: "5h 00m",
    totalLecciones: 15,
    destacado: false,
    nivel: "avanzado",
    tags: ["liderazgo", "equipo", "duplicacion"],
    modulos: [
      {
        id: "lid-mod-1",
        titulo: "Fundamentos del Liderazgo",
        orden: 1,
        lecciones: [
          { id: "lid-1-1", titulo: "Que tipo de lider eres", descripcion: "Autodiagnostico", duracion: "15:00", orden: 1 },
          { id: "lid-1-2", titulo: "Comunicacion efectiva", descripcion: "Habla para inspirar", duracion: "22:00", orden: 2 },
          { id: "lid-1-3", titulo: "Mentalidad de lider", descripcion: "Piensa como un top earner", duracion: "20:00", orden: 3 },
        ],
      },
      {
        id: "lid-mod-2",
        titulo: "Gestion del Equipo",
        orden: 2,
        lecciones: [
          { id: "lid-2-1", titulo: "Reclutamiento estrategico", descripcion: "Atrae a los mejores", duracion: "25:00", orden: 1 },
          { id: "lid-2-2", titulo: "Onboarding efectivo", descripcion: "Primeros 90 dias", duracion: "30:00", orden: 2 },
          { id: "lid-2-3", titulo: "Sistema de duplicacion", descripcion: "Que tu equipo se multiplique", duracion: "28:00", orden: 3 },
        ],
      },
    ],
  },
  {
    id: "instagram-mastery",
    titulo: "Instagram Mastery para Networkers",
    descripcion: "Transforma tu cuenta de Instagram en una maquina de prospeccion. Contenido, reels, stories y estrategias que atraen a tu publico ideal.",
    instructor: "Jorge Leon",
    categoria: "Redes Sociales",
    thumbnail: "/images/courses/instagram.jpg",
    duracionTotal: "3h 45m",
    totalLecciones: 10,
    destacado: true,
    nivel: "basico",
    tags: ["instagram", "contenido", "reels"],
    modulos: [
      {
        id: "ig-mod-1",
        titulo: "Perfil Magnetico",
        orden: 1,
        lecciones: [
          { id: "ig-1-1", titulo: "Bio que convierte", descripcion: "Primera impresion perfecta", duracion: "15:00", orden: 1 },
          { id: "ig-1-2", titulo: "Highlights estrategicos", descripcion: "Organiza tu vitrina", duracion: "18:00", orden: 2 },
        ],
      },
      {
        id: "ig-mod-2",
        titulo: "Contenido que Atrae",
        orden: 2,
        lecciones: [
          { id: "ig-2-1", titulo: "Pilares de contenido", descripcion: "Que publicar y cuando", duracion: "22:00", orden: 1 },
          { id: "ig-2-2", titulo: "Reels virales", descripcion: "Formula probada", duracion: "25:00", orden: 2 },
          { id: "ig-2-3", titulo: "Carouseles que educan", descripcion: "Genera autoridad", duracion: "20:00", orden: 3 },
        ],
      },
    ],
  },
  {
    id: "mindset-networker",
    titulo: "Mindset del Networker Exitoso",
    descripcion: "Reprograma tu mente para el exito. Supera miedos, bloqueos y creencias limitantes que te impiden alcanzar tus metas en el network marketing.",
    instructor: "Jorge Leon",
    categoria: "Mindset",
    thumbnail: "/images/courses/mindset.jpg",
    duracionTotal: "2h 50m",
    totalLecciones: 8,
    destacado: false,
    nivel: "basico",
    tags: ["mindset", "motivacion", "habitos"],
    modulos: [
      {
        id: "ms-mod-1",
        titulo: "Creencias y Bloqueos",
        orden: 1,
        lecciones: [
          { id: "ms-1-1", titulo: "Identifica tus creencias limitantes", descripcion: "Autoanalisis profundo", duracion: "20:00", orden: 1 },
          { id: "ms-1-2", titulo: "Reprogramacion mental", descripcion: "Tecnicas comprobadas", duracion: "22:00", orden: 2 },
        ],
      },
      {
        id: "ms-mod-2",
        titulo: "Habitos de Exito",
        orden: 2,
        lecciones: [
          { id: "ms-2-1", titulo: "Rutina matutina del networker", descripcion: "Empieza el dia ganando", duracion: "18:00", orden: 1 },
          { id: "ms-2-2", titulo: "Gestion del rechazo", descripcion: "Convierte el no en poder", duracion: "25:00", orden: 2 },
        ],
      },
    ],
  },
  {
    id: "facebook-ads",
    titulo: "Facebook Ads para Network Marketing",
    descripcion: "Aprende a crear campanas de publicidad en Facebook e Instagram Ads que generen leads calificados para tu negocio de network marketing.",
    instructor: "Jorge Leon",
    categoria: "Marketing Digital",
    thumbnail: "/images/courses/facebook-ads.jpg",
    duracionTotal: "6h 00m",
    totalLecciones: 18,
    destacado: false,
    nivel: "intermedio",
    tags: ["facebook ads", "meta ads", "publicidad"],
    modulos: [
      {
        id: "fb-mod-1",
        titulo: "Fundamentos de Facebook Ads",
        orden: 1,
        lecciones: [
          { id: "fb-1-1", titulo: "Configura tu Business Manager", descripcion: "Paso a paso", duracion: "20:00", orden: 1 },
          { id: "fb-1-2", titulo: "Pixel y conversiones", descripcion: "Tracking correcto", duracion: "25:00", orden: 2 },
          { id: "fb-1-3", titulo: "Audiencias y segmentacion", descripcion: "Llega al publico correcto", duracion: "22:00", orden: 3 },
        ],
      },
      {
        id: "fb-mod-2",
        titulo: "Campanas que Convierten",
        orden: 2,
        lecciones: [
          { id: "fb-2-1", titulo: "Estructura de campana", descripcion: "CBO vs ABO", duracion: "28:00", orden: 1 },
          { id: "fb-2-2", titulo: "Creativos ganadores", descripcion: "Disena anuncios irresistibles", duracion: "30:00", orden: 2 },
        ],
      },
    ],
  },
  {
    id: "reset-system",
    titulo: "El Sistema RESET",
    descripcion: "La metodologia definitiva para relanzar tu vida y tu negocio. Los 5 pilares del sistema Reset explicados paso a paso.",
    instructor: "Jorge Leon",
    categoria: "Mindset",
    thumbnail: "/images/courses/reset.jpg",
    duracionTotal: "5h 15m",
    totalLecciones: 12,
    destacado: true,
    nivel: "intermedio",
    tags: ["reset", "franquicia", "negocio"],
    communityId: ["comm-reset"],
    modulos: [
      {
        id: "reset-mod-1",
        titulo: "Introduccion al Sistema",
        orden: 1,
        lecciones: [
          { id: "reset-1-1", titulo: "Que es Reset", descripcion: "Filosofia y vision", duracion: "15:00", orden: 1 },
          { id: "reset-1-2", titulo: "Tu primer relanzamiento", descripcion: "Plan de accion", duracion: "25:00", orden: 2 },
        ],
      },
    ],
  },
]

export function getCourseById(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id)
}

export function getCoursesByCategory(category: string, communityId?: string): Course[] {
  const all = communityId
    ? COURSES.filter(c => !c.communityId || c.communityId.includes(communityId))
    : COURSES.filter(c => !c.communityId)

  if (category === "Todos") return all
  return all.filter((c) => c.categoria === category)
}

export function getFeaturedCourses(communityId?: string): Course[] {
  const all = communityId
    ? COURSES.filter(c => !c.communityId || c.communityId.includes(communityId))
    : COURSES.filter(c => !c.communityId)

  return all.filter((c) => c.destacado)
}

export const NIVEL_LABELS: Record<Course["nivel"], string> = {
  basico: "Basico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
}

export const NIVEL_COLORS: Record<Course["nivel"], string> = {
  basico: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  intermedio: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  avanzado: "bg-red-500/10 text-red-400 border-red-500/20",
}
