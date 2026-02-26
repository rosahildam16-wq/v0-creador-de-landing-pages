export interface EtapaEmbudo {
  id: number
  label: string
  icon: string
  description: string
}

export type TipoEmbudo = "cita" | "compra" | "landing"

export interface EmbudoGHLConfig {
  enabled: boolean
  tag: string
  pipelineStageId?: string
  workflowTriggerTag?: string
}

export interface Embudo {
  id: string
  nombre: string
  descripcion: string
  estado: "activo" | "borrador"
  tipo: TipoEmbudo
  fecha_creacion: string
  color: string
  etapas: EtapaEmbudo[]
  ghl?: EmbudoGHLConfig
  persuasiveText?: string
}

export const EMBUDOS: Embudo[] = [
  {
    id: "nomada-vip",
    nombre: "Nomada VIP",
    descripcion: "Embudo principal de captacion para el programa Nomada VIP",
    estado: "activo",
    tipo: "cita",
    fecha_creacion: "2026-01-15",
    color: "hsl(var(--primary))",
    ghl: { enabled: true, tag: "mf_nomada_vip" },
    etapas: [
      { id: 1, label: "Video Hook", icon: "Play", description: "Video inicial de captacion" },
      { id: 2, label: "Llamada Simulada", icon: "Phone", description: "Experiencia de llamada" },
      { id: 3, label: "Quiz Psicologico", icon: "MessageSquare", description: "Cuestionario de perfil" },
      { id: 4, label: "Terminal Hacker", icon: "Terminal", description: "Experiencia hacker" },
      { id: 5, label: "WhatsApp Hook", icon: "MessageSquare", description: "Gancho por WhatsApp" },
      { id: 6, label: "Login", icon: "LogIn", description: "Pantalla de acceso" },
      { id: 7, label: "Feed Social", icon: "Video", description: "Feed tipo TikTok" },
      { id: 8, label: "Pagina de Venta", icon: "ShoppingCart", description: "Oferta final" },
    ],
  },
  {
    id: "funnel-high-ticket-k",
    nombre: "Funnel High Ticket K",
    descripcion: "Embudo de alta conversion para productos high ticket",
    estado: "activo",
    tipo: "compra",
    fecha_creacion: "2026-02-15",
    color: "hsl(var(--chart-2))",
    ghl: { enabled: true, tag: "mf_quiz_networkers_ht" },
    etapas: [
      { id: 1, label: "Video Hook", icon: "Play", description: "Video inicial de captacion" },
      { id: 2, label: "Llamada Simulada", icon: "Phone", description: "Experiencia de llamada" },
      { id: 3, label: "Quiz Psicologico", icon: "MessageSquare", description: "Cuestionario de perfil" },
      { id: 4, label: "Terminal Hacker", icon: "Terminal", description: "Experiencia hacker" },
      { id: 5, label: "WhatsApp Hook", icon: "MessageSquare", description: "Gancho por WhatsApp" },
      { id: 6, label: "Login", icon: "LogIn", description: "Pantalla de acceso" },
      { id: 7, label: "Feed Social", icon: "Video", description: "Feed tipo TikTok" },
      { id: 8, label: "Pagina de Venta", icon: "ShoppingCart", description: "Oferta final" },
    ],
  },
  {
    id: "franquicia-reset",
    nombre: "Franquicia Reset",
    descripcion: "Embudo de captacion para el programa Franquicia Reset",
    estado: "activo",
    tipo: "cita",
    fecha_creacion: "2026-02-15",
    color: "hsl(var(--chart-3))",
    ghl: { enabled: true, tag: "mf_franquicia_reset" },
    persuasiveText: `🚀 ¿Buscas una segunda fuente de ingresos en internet? 

Te presento la *Franquicia Reset*: un modelo de negocio basado en un concepto *100% replicable* y un sistema que ya automatiza el *90% del proceso* por ti. 🪄✨

Mira cómo funciona aquí:`,
    etapas: [
      { id: 1, label: "Video Hook", icon: "Play", description: "Video inicial de captacion" },
      { id: 2, label: "Llamada Simulada", icon: "Phone", description: "Experiencia de llamada" },
      { id: 3, label: "Quiz Psicologico", icon: "MessageSquare", description: "Cuestionario de perfil" },
      { id: 4, label: "Terminal Hacker", icon: "Terminal", description: "Experiencia hacker" },
      { id: 5, label: "WhatsApp Hook", icon: "MessageSquare", description: "Gancho por WhatsApp" },
      { id: 6, label: "Login", icon: "LogIn", description: "Pantalla de acceso" },
      { id: 7, label: "Feed Social", icon: "Video", description: "Feed tipo TikTok" },
      { id: 8, label: "Pagina de Venta", icon: "ShoppingCart", description: "Oferta final" },
    ],
  },
  {
    id: "tu-esclavo-digital",
    nombre: "Tu Esclavo Digital",
    descripcion: "Embudo de conversion para el programa Tu Esclavo Digital",
    estado: "activo",
    tipo: "compra",
    fecha_creacion: "2026-02-15",
    color: "hsl(var(--chart-4))",
    ghl: { enabled: true, tag: "mf_esclavo_digital" },
    etapas: [
      { id: 1, label: "Video Hook", icon: "Play", description: "Video inicial de captacion" },
      { id: 2, label: "Llamada Simulada", icon: "Phone", description: "Experiencia de llamada" },
      { id: 3, label: "Quiz Psicologico", icon: "MessageSquare", description: "Cuestionario de perfil" },
      { id: 4, label: "Terminal Hacker", icon: "Terminal", description: "Experiencia hacker" },
      { id: 5, label: "WhatsApp Hook", icon: "MessageSquare", description: "Gancho por WhatsApp" },
      { id: 6, label: "Login", icon: "LogIn", description: "Pantalla de acceso" },
      { id: 7, label: "Feed Social", icon: "Video", description: "Feed tipo TikTok" },
      { id: 8, label: "Pagina de Venta", icon: "ShoppingCart", description: "Oferta final" },
    ],
  },
  {
    id: "esclavo-digital-masterclass",
    nombre: "Esclavo Digital Masterclass",
    descripcion: "Landing de captacion: Crea contenido infinito, anuncios y clones digitales con IA",
    estado: "activo",
    tipo: "landing",
    fecha_creacion: "2026-02-21",
    color: "hsl(185 80% 50%)",
    ghl: { enabled: true, tag: "mf_esclavo_digital_mc" },
    etapas: [
      { id: 1, label: "Hero + Impacto", icon: "Play", description: "Contenido infinito y clon digital con IA" },
      { id: 2, label: "Problema", icon: "AlertTriangle", description: "Crear contenido manualmente ya no tiene sentido" },
      { id: 3, label: "Concepto IA", icon: "Bot", description: "Sistema que crea videos, anuncios y avatares" },
      { id: 4, label: "Aprendizaje", icon: "Brain", description: "6 bloques: contenido, anuncios, clon, influencer IA" },
      { id: 5, label: "Demo + Autoridad", icon: "Monitor", description: "Sin camara, sin estudio, sin experiencia" },
      { id: 6, label: "CTA Final", icon: "ShoppingCart", description: "Registro y countdown" },
    ],
  },
  {
    id: "munot-detox",
    nombre: "MUNOT Detox",
    descripcion: "Landing page de venta para MUNOT - Infusion Herbal Detox Metabolica",
    estado: "activo",
    tipo: "landing",
    fecha_creacion: "2026-02-18",
    color: "hsl(var(--chart-5))",
    ghl: { enabled: true, tag: "mf_munot_detox" },
    etapas: [
      { id: 1, label: "Hero + Problema", icon: "Play", description: "Seccion hero y senales de alerta" },
      { id: 2, label: "Beneficios", icon: "ShoppingCart", description: "Beneficios e ingredientes" },
      { id: 3, label: "Protocolo + Bonos", icon: "MessageSquare", description: "Que incluye el protocolo" },
      { id: 4, label: "Oferta + CTA", icon: "ShoppingCart", description: "Precio y boton de compra" },
      { id: 5, label: "Testimonios + FAQ", icon: "Users", description: "Prueba social y preguntas" },
    ],
  },
]
