"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DollarSign, Shield, TrendingUp, Plus, Trash2, Tag,
  Building2, Percent, Loader2, Check, X, ChevronDown,
} from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PlanBase {
  code: string
  name: string
  price: number
  annual_price: number
}

interface CommunityRow {
  id: string
  nombre: string
  color: string
}

interface Override {
  id: string
  community_id: string
  plan_code: string
  monthly_price: number
  annual_price: number | null
  note: string | null
  is_active: boolean
  communities?: { nombre: string }
  platform_plans?: { name: string; price: number }
}

interface Discount {
  id: string
  user_id: string
  plan_code: string | null
  discount_type: "pct" | "fixed"
  discount_value: number
  billing_scope: string
  valid_from: string
  valid_until: string | null
  max_uses: number | null
  used_count: number
  reason: string | null
  is_active: boolean
  created_at: string
}

const PLAN_CODES = ["plan_27", "plan_47", "plan_97", "plan_300"]
const PLAN_LABELS: Record<string, string> = {
  plan_27: "Member ($27)",
  plan_47: "Creator ($47)",
  plan_97: "Elite ($97)",
  plan_300: "Club ($300)",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPlanesPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "overrides" | "discounts">("overview")

  // Overview data
  const [plans, setPlans] = useState<PlanBase[]>([])
  const [communities, setCommunities] = useState<CommunityRow[]>([])

  // Overrides
  const [overrides, setOverrides] = useState<Override[]>([])
  const [overrideForm, setOverrideForm] = useState({
    community_id: "",
    plan_code: "plan_27",
    monthly_price: "",
    annual_price: "",
    note: "",
  })
  const [overrideSubmitting, setOverrideSubmitting] = useState(false)
  const [overrideMsg, setOverrideMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Discounts
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [discountForm, setDiscountForm] = useState({
    user_id: "",
    plan_code: "",
    discount_type: "pct" as "pct" | "fixed",
    discount_value: "",
    billing_scope: "both",
    valid_until: "",
    max_uses: "",
    reason: "",
  })
  const [discountSubmitting, setDiscountSubmitting] = useState(false)
  const [discountMsg, setDiscountMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [loading, setLoading] = useState(true)

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, commRes, ovRes, discRes] = await Promise.all([
          fetch("/api/platform/plans").then((r) => r.json()),
          fetch("/api/communities").then((r) => r.json()),
          fetch("/api/admin/pricing/overrides").then((r) => r.json()),
          fetch("/api/admin/pricing/discounts").then((r) => r.json()),
        ])
        setPlans((plansRes.plans ?? []).filter((p: PlanBase) => p.code !== "student"))
        setCommunities(commRes.communities ?? [])
        setOverrides(ovRes.overrides ?? [])
        setDiscounts(discRes.discounts ?? [])
      } catch (e) {
        console.error("load error", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Override handlers ────────────────────────────────────────────────────────

  const submitOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    setOverrideMsg(null)
    const monthly = parseFloat(overrideForm.monthly_price)
    if (isNaN(monthly) || monthly < 0) {
      setOverrideMsg({ ok: false, text: "Precio mensual inválido" })
      return
    }
    setOverrideSubmitting(true)
    try {
      const res = await fetch("/api/admin/pricing/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community_id: overrideForm.community_id,
          plan_code: overrideForm.plan_code,
          monthly_price: monthly,
          annual_price: overrideForm.annual_price ? parseFloat(overrideForm.annual_price) : null,
          note: overrideForm.note || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOverrideMsg({ ok: false, text: data.error ?? "Error" })
      } else {
        setOverrideMsg({ ok: true, text: "Override guardado correctamente" })
        setOverrides((prev) => {
          const filtered = prev.filter(
            (o) => !(o.community_id === overrideForm.community_id && o.plan_code === overrideForm.plan_code)
          )
          return [data.override, ...filtered]
        })
        setOverrideForm((f) => ({ ...f, monthly_price: "", annual_price: "", note: "" }))
      }
    } finally {
      setOverrideSubmitting(false)
    }
  }

  const deleteOverride = async (communityId: string, planCode: string) => {
    if (!confirm("¿Eliminar este override de precio?")) return
    await fetch("/api/admin/pricing/overrides", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ community_id: communityId, plan_code: planCode }),
    })
    setOverrides((prev) =>
      prev.filter((o) => !(o.community_id === communityId && o.plan_code === planCode))
    )
  }

  // ── Discount handlers ────────────────────────────────────────────────────────

  const submitDiscount = async (e: React.FormEvent) => {
    e.preventDefault()
    setDiscountMsg(null)
    const val = parseFloat(discountForm.discount_value)
    if (isNaN(val) || val < 0) {
      setDiscountMsg({ ok: false, text: "Valor de descuento inválido" })
      return
    }
    if (!discountForm.user_id.trim()) {
      setDiscountMsg({ ok: false, text: "Se requiere User ID" })
      return
    }
    setDiscountSubmitting(true)
    try {
      const res = await fetch("/api/admin/pricing/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: discountForm.user_id.trim(),
          plan_code: discountForm.plan_code || null,
          discount_type: discountForm.discount_type,
          discount_value: val,
          billing_scope: discountForm.billing_scope,
          valid_until: discountForm.valid_until || null,
          max_uses: discountForm.max_uses ? parseInt(discountForm.max_uses) : null,
          reason: discountForm.reason || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setDiscountMsg({ ok: false, text: data.error ?? "Error" })
      } else {
        setDiscountMsg({ ok: true, text: "Descuento creado correctamente" })
        setDiscounts((prev) => [data.discount, ...prev])
        setDiscountForm({
          user_id: "",
          plan_code: "",
          discount_type: "pct",
          discount_value: "",
          billing_scope: "both",
          valid_until: "",
          max_uses: "",
          reason: "",
        })
      }
    } finally {
      setDiscountSubmitting(false)
    }
  }

  const revokeDiscount = async (id: string) => {
    if (!confirm("¿Revocar este descuento?")) return
    await fetch("/api/admin/pricing/discounts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setDiscounts((prev) => prev.map((d) => (d.id === id ? { ...d, is_active: false } : d)))
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planes y Precios</h1>
        <p className="text-sm text-muted-foreground">
          Gestión global de suscripciones, precios por comunidad y descuentos personalizados
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{plans.length}</p>
              <p className="text-xs text-muted-foreground">Planes activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Building2 className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {overrides.filter((o) => o.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">Overrides activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Percent className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {discounts.filter((d) => d.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">Descuentos activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50 pb-0">
        {(["overview", "overrides", "discounts"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab
                ? "text-foreground border border-b-background border-border/50 bg-background -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "overview" ? "Planes globales" : tab === "overrides" ? "Precios por comunidad" : "Descuentos por usuario"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ── Tab: Overview ─────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan) => (
                <Card key={plan.code} className="border-border/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">{plan.name}</CardTitle>
                    <p className="text-[11px] text-muted-foreground font-mono">{plan.code}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Mensual</span>
                      <span className="text-sm font-bold text-foreground">${plan.price}/mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Anual (20% off)</span>
                      <span className="text-sm font-bold text-emerald-500">
                        ${plan.annual_price ?? Math.round(plan.price * 12 * 0.8 * 100) / 100}/yr
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                      ≈ ${Math.round((plan.annual_price ?? plan.price * 12 * 0.8) / 12 * 100) / 100}/mes en plan anual
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* ── Tab: Overrides ────────────────────────────────────────────────── */}
          {activeTab === "overrides" && (
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              {/* Form */}
              <Card className="border-border/50 h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Nuevo override de precio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitOverride} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Comunidad</label>
                      <select
                        value={overrideForm.community_id}
                        onChange={(e) => setOverrideForm((f) => ({ ...f, community_id: e.target.value }))}
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        required
                      >
                        <option value="">-- Seleccionar comunidad --</option>
                        {communities.map((c) => (
                          <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Plan</label>
                      <select
                        value={overrideForm.plan_code}
                        onChange={(e) => setOverrideForm((f) => ({ ...f, plan_code: e.target.value }))}
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        {PLAN_CODES.map((code) => (
                          <option key={code} value={code}>{PLAN_LABELS[code]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Precio mensual ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={overrideForm.monthly_price}
                          onChange={(e) => setOverrideForm((f) => ({ ...f, monthly_price: e.target.value }))}
                          placeholder="Ej: 10"
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Precio anual ($) <span className="text-muted-foreground/40">opcional</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={overrideForm.annual_price}
                          onChange={(e) => setOverrideForm((f) => ({ ...f, annual_price: e.target.value }))}
                          placeholder="Auto -20%"
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nota interna</label>
                      <input
                        type="text"
                        value={overrideForm.note}
                        onChange={(e) => setOverrideForm((f) => ({ ...f, note: e.target.value }))}
                        placeholder="Ej: Precio acordado con lider"
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>

                    {overrideMsg && (
                      <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${overrideMsg.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400"}`}>
                        {overrideMsg.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {overrideMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={overrideSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {overrideSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Guardar override
                    </button>
                  </form>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Overrides activos</CardTitle>
                </CardHeader>
                <CardContent>
                  {overrides.filter((o) => o.is_active).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay overrides de precio configurados.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {overrides
                        .filter((o) => o.is_active)
                        .map((o) => (
                          <div
                            key={o.id}
                            className="flex items-center justify-between rounded-lg border border-border/30 p-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {o.communities?.nombre ?? o.community_id}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                  {PLAN_LABELS[o.plan_code] ?? o.plan_code}
                                </span>
                              </div>
                              {o.note && <p className="text-xs text-muted-foreground mt-0.5">{o.note}</p>}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-bold text-foreground">${o.monthly_price}/mo</p>
                                <p className="text-[11px] text-muted-foreground">
                                  ${o.annual_price ?? Math.round(o.monthly_price * 12 * 0.8 * 100) / 100}/yr
                                </p>
                              </div>
                              <button
                                onClick={() => deleteOverride(o.community_id, o.plan_code)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Tab: Discounts ────────────────────────────────────────────────── */}
          {activeTab === "discounts" && (
            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
              {/* Form */}
              <Card className="border-border/50 h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Nuevo descuento de usuario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitDiscount} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        User ID del miembro
                      </label>
                      <input
                        type="text"
                        value={discountForm.user_id}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, user_id: e.target.value }))}
                        placeholder="reg-username"
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        required
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Formato: reg-username (community_members.member_id)
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        Plan <span className="text-muted-foreground/40">(vacío = cualquier plan)</span>
                      </label>
                      <select
                        value={discountForm.plan_code}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, plan_code: e.target.value }))}
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="">Cualquier plan</option>
                        {PLAN_CODES.map((code) => (
                          <option key={code} value={code}>{PLAN_LABELS[code]}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo</label>
                        <select
                          value={discountForm.discount_type}
                          onChange={(e) => setDiscountForm((f) => ({ ...f, discount_type: e.target.value as "pct" | "fixed" }))}
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                          <option value="pct">% Porcentaje</option>
                          <option value="fixed">$ Fijo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                          Valor ({discountForm.discount_type === "pct" ? "%" : "$"})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={discountForm.discount_type === "pct" ? 100 : undefined}
                          step="0.01"
                          value={discountForm.discount_value}
                          onChange={(e) => setDiscountForm((f) => ({ ...f, discount_value: e.target.value }))}
                          placeholder={discountForm.discount_type === "pct" ? "Ej: 20" : "Ej: 10"}
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Aplica a</label>
                      <select
                        value={discountForm.billing_scope}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, billing_scope: e.target.value }))}
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      >
                        <option value="both">Mensual y anual</option>
                        <option value="monthly">Solo mensual</option>
                        <option value="annual">Solo anual</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Vence</label>
                        <input
                          type="date"
                          value={discountForm.valid_until}
                          onChange={(e) => setDiscountForm((f) => ({ ...f, valid_until: e.target.value }))}
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Usos máx.</label>
                        <input
                          type="number"
                          min="1"
                          value={discountForm.max_uses}
                          onChange={(e) => setDiscountForm((f) => ({ ...f, max_uses: e.target.value }))}
                          placeholder="Sin límite"
                          className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Razón / nota</label>
                      <input
                        type="text"
                        value={discountForm.reason}
                        onChange={(e) => setDiscountForm((f) => ({ ...f, reason: e.target.value }))}
                        placeholder="Ej: Descuento VIP acordado"
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                      />
                    </div>

                    {discountMsg && (
                      <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${discountMsg.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400"}`}>
                        {discountMsg.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {discountMsg.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={discountSubmitting}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {discountSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Crear descuento
                    </button>
                  </form>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Descuentos activos</CardTitle>
                </CardHeader>
                <CardContent>
                  {discounts.filter((d) => d.is_active).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No hay descuentos personalizados activos.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {discounts
                        .filter((d) => d.is_active)
                        .map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between rounded-lg border border-border/30 p-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground font-mono">{d.user_id}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                  d.discount_type === "pct"
                                    ? "bg-violet-500/10 text-violet-400"
                                    : "bg-emerald-500/10 text-emerald-400"
                                }`}>
                                  {d.discount_type === "pct" ? `-${d.discount_value}%` : `-$${d.discount_value}`}
                                </span>
                                {d.plan_code && (
                                  <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                    {PLAN_LABELS[d.plan_code] ?? d.plan_code}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-muted-foreground">
                                  {d.billing_scope === "both" ? "Mensual y anual" : d.billing_scope}
                                  {d.valid_until ? ` · Vence: ${new Date(d.valid_until).toLocaleDateString()}` : ""}
                                  {d.max_uses ? ` · ${d.used_count}/${d.max_uses} usos` : ""}
                                </p>
                                {d.reason && <p className="text-xs text-muted-foreground">— {d.reason}</p>}
                              </div>
                            </div>
                            <button
                              onClick={() => revokeDiscount(d.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
