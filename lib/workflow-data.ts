// Mock data and types for the Workflows + Messaging module
// This file is independent and does not modify any existing data

// ─── Types ───

export type TemplateType = "whatsapp" | "email"

export interface Template {
  id: string
  type: TemplateType
  name: string
  subject?: string // only for email
  content: string
  variables: string[]
  created_at: string
}

export type WorkflowTrigger = "booking_created" | "lead_created" | "booking_canceled" | "booking_rescheduled"

export type WorkflowActionType = "send_whatsapp" | "send_email"

export type DelayOption = 0 | 10 | 60 | 1440 // in minutes: 0, 10min, 1h, 24h

export interface WorkflowAction {
  id: string
  type: WorkflowActionType
  template_id: string
  delay_minutes: DelayOption
}

export interface WorkflowRule {
  id: string
  name: string
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  enabled: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface MessageLog {
  id: string
  channel: "whatsapp" | "email"
  contact_name: string
  contact_email: string
  contact_phone: string
  template_id: string
  template_name: string
  status: "sent" | "failed" | "queued"
  provider_response: string
  workflow_name: string
  created_at: string
}

export interface ContactMin {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  source: string
  created_at: string
}

// ─── Constants ───

export const TRIGGER_LABELS: Record<WorkflowTrigger, string> = {
  booking_created: "Cita agendada",
  lead_created: "Lead creado",
  booking_canceled: "Cita cancelada",
  booking_rescheduled: "Cita reagendada",
}

export const ACTION_TYPE_LABELS: Record<WorkflowActionType, string> = {
  send_whatsapp: "Enviar WhatsApp",
  send_email: "Enviar Email",
}

export const DELAY_OPTIONS: { value: DelayOption; label: string }[] = [
  { value: 0, label: "Inmediato" },
  { value: 10, label: "10 minutos" },
  { value: 60, label: "1 hora" },
  { value: 1440, label: "24 horas" },
]

export const AVAILABLE_VARIABLES = [
  "{{first_name}}",
  "{{email}}",
  "{{phone}}",
  "{{booking_date}}",
  "{{booking_time}}",
  "{{booking_link}}",
]

// ─── Mock Templates ───

export const MOCK_TEMPLATES: Template[] = [
  {
    id: "tpl-wa-001",
    type: "whatsapp",
    name: "Confirmacion de cita",
    content:
      "Hola {{first_name}}, tu cita ha sido confirmada para el {{booking_date}} a las {{booking_time}}. Si necesitas cambiarla, haz clic aqui: {{booking_link}}",
    variables: ["first_name", "booking_date", "booking_time", "booking_link"],
    created_at: "2026-02-10T14:00:00Z",
  },
  {
    id: "tpl-wa-002",
    type: "whatsapp",
    name: "Recordatorio 24h",
    content:
      "Hola {{first_name}}, te recordamos que tienes una cita manana {{booking_date}} a las {{booking_time}}. Te esperamos.",
    variables: ["first_name", "booking_date", "booking_time"],
    created_at: "2026-02-10T15:00:00Z",
  },
  {
    id: "tpl-wa-003",
    type: "whatsapp",
    name: "Bienvenida lead",
    content:
      "Hola {{first_name}}, gracias por tu interes. Un asesor se pondra en contacto contigo pronto. Cualquier duda escribenos aqui.",
    variables: ["first_name"],
    created_at: "2026-02-11T10:00:00Z",
  },
  {
    id: "tpl-em-001",
    type: "email",
    name: "Confirmacion de cita",
    subject: "Tu cita ha sido confirmada",
    content:
      "<h2>Hola {{first_name}}</h2><p>Tu cita ha sido agendada para el <strong>{{booking_date}}</strong> a las <strong>{{booking_time}}</strong>.</p><p>Si necesitas reagendar, haz clic aqui: <a href='{{booking_link}}'>Reagendar cita</a></p>",
    variables: ["first_name", "booking_date", "booking_time", "booking_link"],
    created_at: "2026-02-10T14:00:00Z",
  },
  {
    id: "tpl-em-002",
    type: "email",
    name: "Recordatorio 24h",
    subject: "Recordatorio: tu cita es manana",
    content:
      "<h2>Hola {{first_name}}</h2><p>Te recordamos que tienes una cita programada para manana <strong>{{booking_date}}</strong> a las <strong>{{booking_time}}</strong>.</p><p>Te esperamos.</p>",
    variables: ["first_name", "booking_date", "booking_time"],
    created_at: "2026-02-10T15:00:00Z",
  },
  {
    id: "tpl-em-003",
    type: "email",
    name: "Bienvenida lead",
    subject: "Bienvenido a Nomada",
    content:
      "<h2>Hola {{first_name}}</h2><p>Gracias por registrarte. Pronto un asesor se pondra en contacto contigo.</p><p>Mientras tanto, puedes agendar tu primera sesion gratuita: <a href='{{booking_link}}'>Agendar ahora</a></p>",
    variables: ["first_name", "booking_link"],
    created_at: "2026-02-11T10:00:00Z",
  },
]

// ─── Mock Workflow Rules ───

export const MOCK_WORKFLOWS: WorkflowRule[] = [
  {
    id: "wf-001",
    name: "Confirmacion automatica de cita",
    trigger: "booking_created",
    actions: [
      {
        id: "act-001",
        type: "send_whatsapp",
        template_id: "tpl-wa-001",
        delay_minutes: 0,
      },
      {
        id: "act-002",
        type: "send_email",
        template_id: "tpl-em-001",
        delay_minutes: 0,
      },
    ],
    enabled: true,
    is_default: true,
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-02-14T12:00:00Z",
  },
  {
    id: "wf-002",
    name: "Recordatorio 24h antes de cita",
    trigger: "booking_created",
    actions: [
      {
        id: "act-003",
        type: "send_whatsapp",
        template_id: "tpl-wa-002",
        delay_minutes: 1440,
      },
      {
        id: "act-004",
        type: "send_email",
        template_id: "tpl-em-002",
        delay_minutes: 1440,
      },
    ],
    enabled: true,
    is_default: false,
    created_at: "2026-02-05T10:00:00Z",
    updated_at: "2026-02-14T12:00:00Z",
  },
  {
    id: "wf-003",
    name: "Bienvenida a nuevo lead",
    trigger: "lead_created",
    actions: [
      {
        id: "act-005",
        type: "send_whatsapp",
        template_id: "tpl-wa-003",
        delay_minutes: 0,
      },
      {
        id: "act-006",
        type: "send_email",
        template_id: "tpl-em-003",
        delay_minutes: 10,
      },
    ],
    enabled: false,
    is_default: false,
    created_at: "2026-02-08T10:00:00Z",
    updated_at: "2026-02-14T12:00:00Z",
  },
]

// ─── Mock Message Logs ───

export const MOCK_MESSAGE_LOGS: MessageLog[] = [
  {
    id: "log-001",
    channel: "whatsapp",
    contact_name: "Carlos Martinez",
    contact_email: "carlos.martinez@gmail.com",
    contact_phone: "+52 312 456 7890",
    template_id: "tpl-wa-001",
    template_name: "Confirmacion de cita",
    status: "sent",
    provider_response: '{"messages":[{"id":"wamid.xxx"}]}',
    workflow_name: "Confirmacion automatica de cita",
    created_at: "2026-02-15T09:30:00Z",
  },
  {
    id: "log-002",
    channel: "email",
    contact_name: "Carlos Martinez",
    contact_email: "carlos.martinez@gmail.com",
    contact_phone: "+52 312 456 7890",
    template_id: "tpl-em-001",
    template_name: "Confirmacion de cita",
    status: "sent",
    provider_response: '{"id":"sg_xxx","statusCode":202}',
    workflow_name: "Confirmacion automatica de cita",
    created_at: "2026-02-15T09:30:05Z",
  },
  {
    id: "log-003",
    channel: "whatsapp",
    contact_name: "Maria Garcia",
    contact_email: "maria.garcia@gmail.com",
    contact_phone: "+52 555 123 4567",
    template_id: "tpl-wa-001",
    template_name: "Confirmacion de cita",
    status: "failed",
    provider_response: '{"error":{"message":"Invalid phone number","code":131009}}',
    workflow_name: "Confirmacion automatica de cita",
    created_at: "2026-02-15T08:15:00Z",
  },
  {
    id: "log-004",
    channel: "email",
    contact_name: "Juan Lopez",
    contact_email: "juan.lopez@gmail.com",
    contact_phone: "+52 333 789 0123",
    template_id: "tpl-em-003",
    template_name: "Bienvenida lead",
    status: "queued",
    provider_response: "",
    workflow_name: "Bienvenida a nuevo lead",
    created_at: "2026-02-15T10:00:00Z",
  },
  {
    id: "log-005",
    channel: "whatsapp",
    contact_name: "Ana Rodriguez",
    contact_email: "ana.rodriguez@gmail.com",
    contact_phone: "+52 444 567 8901",
    template_id: "tpl-wa-002",
    template_name: "Recordatorio 24h",
    status: "sent",
    provider_response: '{"messages":[{"id":"wamid.yyy"}]}',
    workflow_name: "Recordatorio 24h antes de cita",
    created_at: "2026-02-14T18:00:00Z",
  },
  {
    id: "log-006",
    channel: "email",
    contact_name: "Pedro Sanchez",
    contact_email: "pedro.sanchez@gmail.com",
    contact_phone: "+52 222 345 6789",
    template_id: "tpl-em-001",
    template_name: "Confirmacion de cita",
    status: "sent",
    provider_response: '{"id":"sg_zzz","statusCode":202}',
    workflow_name: "Confirmacion automatica de cita",
    created_at: "2026-02-14T16:30:00Z",
  },
]

// ─── Mock Contacts (minimal) ───

export const MOCK_CONTACTS_MIN: ContactMin[] = [
  {
    id: "ct-001",
    first_name: "Carlos",
    last_name: "Martinez",
    email: "carlos.martinez@gmail.com",
    phone: "+52 312 456 7890",
    source: "embudo-nomadas",
    created_at: "2026-02-15T09:00:00Z",
  },
  {
    id: "ct-002",
    first_name: "Maria",
    last_name: "Garcia",
    email: "maria.garcia@gmail.com",
    phone: "+52 555 123 4567",
    source: "embudo-nomadas",
    created_at: "2026-02-15T08:00:00Z",
  },
  {
    id: "ct-003",
    first_name: "Juan",
    last_name: "Lopez",
    email: "juan.lopez@gmail.com",
    phone: "+52 333 789 0123",
    source: "webhook-manual",
    created_at: "2026-02-15T10:00:00Z",
  },
]

// ─── Helper functions ───

export function getTemplateById(id: string): Template | undefined {
  return MOCK_TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByType(type: TemplateType): Template[] {
  return MOCK_TEMPLATES.filter((t) => t.type === type)
}

export function formatDelayLabel(minutes: DelayOption): string {
  const option = DELAY_OPTIONS.find((o) => o.value === minutes)
  return option?.label ?? `${minutes} min`
}
