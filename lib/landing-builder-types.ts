// Types for the Landing Page Builder

export type BlockType =
  | "hero"
  | "problem"
  | "benefits"
  | "testimonials"
  | "cta"
  | "faq"
  | "countdown"
  | "form"
  | "video"
  | "gallery"
  | "community"
  | "whatsapp_final"

export interface LandingBlock {
  id: string
  type: BlockType
  props: Record<string, unknown>
  order: number
}

export interface LandingTheme {
  primaryColor: string
  backgroundColor: string
  textColor: string
  accentColor: string
  fontFamily: "sans" | "serif" | "mono"
  borderRadius: "none" | "sm" | "md" | "lg" | "full"
}

export interface LandingConfig {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  theme: LandingTheme
  blocks: LandingBlock[]
  status: "draft" | "published"
  slug?: string
  customDomain?: string
}

// Block-specific prop types
export interface HeroProps {
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  badgeText: string
  backgroundStyle: "gradient" | "solid" | "image"
  backgroundImage: string
  alignment: "center" | "left"
}

export interface ProblemProps {
  sectionTitle: string
  painPoints: Array<{ icon: string; text: string }>
  accentColor: string
}

export interface BenefitsProps {
  sectionTitle: string
  benefits: Array<{ icon: string; title: string; description: string }>
  layout: "grid" | "list"
}

export interface TestimonialsProps {
  sectionTitle: string
  testimonials: Array<{ name: string; text: string; label: string }>
  layout: "grid" | "carousel"
}

export interface CtaProps {
  title: string
  description: string
  originalPrice: string
  offerPrice: string
  buttonText: string
  buttonLink: string
  urgencyText: string
  features: string[]
}

export interface FaqProps {
  sectionTitle: string
  questions: Array<{ question: string; answer: string }>
  style: "accordion" | "list"
}

export interface CountdownProps {
  targetDate: string
  title: string
  subtitle: string
  style: "cards" | "inline"
}

export interface FormProps {
  title: string
  subtitle: string
  fields: Array<{ name: string; type: "text" | "email" | "tel" | "select"; label: string; required: boolean }>
  buttonText: string
  successMessage: string
  // Form Builder integration — when set, renders the Form Builder form instead of static fields
  form_slug?: string
  form_embed_mode?: "inline" | "redirect"
}

export interface VideoProps {
  url: string
  title: string
  description: string
  autoplay: boolean
  layout: "full" | "contained"
}

export interface GalleryProps {
  sectionTitle: string
  images: Array<{ url: string; alt: string }>
  columns: 2 | 3 | 4
  layout: "grid" | "masonry"
}

export interface CommunityProps {
  sectionTitle: string
  description: string
  communityName: string
  memberCount: string
  categories: Array<{ name: string; emoji: string }>
  posts: Array<{
    author: string
    content: string
    timeAgo: string
    likes: number
    comments: number
    category: string
    badge?: string
  }>
  leaderboard: Array<{
    name: string
    points: number
    level: number
    badge: string
  }>
  showLeaderboard: boolean
  showCategories: boolean
  layout: "feed" | "split"
}

// Block metadata for the palette
export interface BlockMeta {
  type: BlockType
  label: string
  description: string
  icon: string
  category: "content" | "conversion" | "media"
}

export const BLOCK_CATALOG: BlockMeta[] = [
  { type: "hero", label: "Hero", description: "Seccion principal con titulo y CTA", icon: "Sparkles", category: "content" },
  { type: "problem", label: "Problema", description: "Pain points de tu audiencia", icon: "AlertTriangle", category: "content" },
  { type: "benefits", label: "Beneficios", description: "Lo que ofreces", icon: "Gift", category: "content" },
  { type: "testimonials", label: "Testimonios", description: "Prueba social", icon: "MessageSquare", category: "content" },
  { type: "faq", label: "FAQ", description: "Preguntas frecuentes", icon: "HelpCircle", category: "content" },
  { type: "cta", label: "CTA / Oferta", description: "Llamada a la accion", icon: "Zap", category: "conversion" },
  { type: "countdown", label: "Countdown", description: "Temporizador de urgencia", icon: "Clock", category: "conversion" },
  { type: "form", label: "Formulario", description: "Captura de datos", icon: "FileText", category: "conversion" },
  { type: "video", label: "Video", description: "Video embebido", icon: "Play", category: "media" },
  { type: "gallery", label: "Galeria", description: "Galeria de imagenes", icon: "Image", category: "media" },
  { type: "community", label: "Comunidad", description: "Comunidad interactiva", icon: "Users", category: "content" },
  { type: "whatsapp_final", label: "WhatsApp Chat", description: "Experiencia de WhatsApp interactiva", icon: "MessageSquare", category: "conversion" },
]

export type TemplateKey = "venta" | "leads" | "evento"

export interface Template {
  key: TemplateKey
  name: string
  description: string
  icon: string
  blocks: BlockType[]
}

export const TEMPLATES: Template[] = [
  {
    key: "venta",
    name: "Landing de Venta",
    description: "Ideal para vender productos o servicios digitales",
    icon: "ShoppingCart",
    blocks: ["hero", "problem", "benefits", "testimonials", "cta", "faq"],
  },
  {
    key: "leads",
    name: "Captacion de Leads",
    description: "Captura emails y datos de prospectos",
    icon: "Users",
    blocks: ["hero", "video", "form", "benefits", "faq"],
  },
  {
    key: "evento",
    name: "Evento / Masterclass",
    description: "Promociona tu evento en vivo o webinar",
    icon: "Calendar",
    blocks: ["hero", "countdown", "video", "benefits", "cta", "faq"],
  },
]
