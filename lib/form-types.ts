// ─── Form Builder Types ────────────────────────────────────────────────────

export type FormMode = "classic" | "conversational"
export type FormStatus = "draft" | "published"

export type QuestionType =
    | "short_text"
    | "long_text"
    | "email"
    | "phone"
    | "single_choice"
    | "multiple_choice"
    | "dropdown"
    | "number"
    | "date"
    | "rating"
    | "visual_buttons"

export interface QuestionOption {
    value: string
    label: string
    image_url?: string
}

export interface QuestionSettings {
    crm_field?: "nombre" | "email" | "whatsapp" | "custom"
    min?: number
    max?: number
    stars?: number  // for rating (default 5)
}

export interface FormQuestion {
    id: string
    form_id: string
    type: QuestionType
    label: string
    description?: string
    placeholder?: string
    required: boolean
    order_index: number
    options?: QuestionOption[]
    settings?: QuestionSettings
}

export interface FormLogicRule {
    id: string
    form_id: string
    question_id: string
    condition_value: string
    action_type: "jump_to" | "end_form"
    target_question_id?: string
}

export interface WelcomeScreen {
    title: string
    subtitle?: string
    button_label: string
    image_url?: string
}

export interface EndScreen {
    title: string
    subtitle?: string
    redirect_url?: string
    show_booking?: boolean
    booking_calendar_slug?: string
}

export interface FormDesign {
    primary_color: string
    bg_color: string
    font: "sans" | "serif" | "mono"
    logo_url?: string
}

export interface FormSettings {
    pipeline_stage?: string
    tag?: string
    score?: number
    notify_email?: boolean
}

export interface Form {
    id: string
    owner_email: string
    name: string
    slug: string
    description?: string
    status: FormStatus
    mode: FormMode
    welcome_screen?: WelcomeScreen
    end_screen?: EndScreen
    design?: FormDesign
    settings?: FormSettings
    views: number
    starts: number
    completions: number
    created_at: string
    updated_at: string
    // joined
    questions?: FormQuestion[]
    logic_rules?: FormLogicRule[]
}

export interface FormSubmission {
    id: string
    form_id: string
    lead_id?: string
    submitted_at: string
    ip_address?: string
    metadata?: Record<string, unknown>
    answers?: FormAnswer[]
}

export interface FormAnswer {
    id: string
    submission_id: string
    form_id: string
    question_id: string
    question_label?: string
    value: string
}

// ─── UI helpers ────────────────────────────────────────────────────────────

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    short_text: "Texto corto",
    long_text: "Texto largo",
    email: "Email",
    phone: "Teléfono",
    single_choice: "Selección única",
    multiple_choice: "Selección múltiple",
    dropdown: "Dropdown",
    number: "Número",
    date: "Fecha",
    rating: "Calificación",
    visual_buttons: "Botones visuales",
}

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
    short_text: "Aa",
    long_text: "¶",
    email: "@",
    phone: "#",
    single_choice: "◉",
    multiple_choice: "☑",
    dropdown: "▾",
    number: "123",
    date: "📅",
    rating: "★",
    visual_buttons: "⬜",
}

export const DEFAULT_DESIGN: FormDesign = {
    primary_color: "#7c3aed",
    bg_color: "#0f0a1a",
    font: "sans",
}

export const DEFAULT_WELCOME: WelcomeScreen = {
    title: "Bienvenido",
    subtitle: "Completa este formulario para continuar.",
    button_label: "Comenzar",
}

export const DEFAULT_END: EndScreen = {
    title: "¡Gracias por tu respuesta!",
    subtitle: "Nos pondremos en contacto contigo pronto.",
}

export function generateFormId(): string {
    return `form_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function generateSubmissionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function generateAnswerId(): string {
    return `ans_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function slugify(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
}

/** Returns the conversion rate as a percentage string */
export function conversionRate(form: Form): string {
    if (!form.starts) return "0%"
    return `${Math.round((form.completions / form.starts) * 100)}%`
}
