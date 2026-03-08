"use client"

import { type ReactNode } from "react"
import { Lock, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { type PlanCode, type PlanFeatures, hasFeature, requiredPlanFor, PLANS } from "@/lib/plans"

interface FeatureGateProps {
  /** The feature key to check in the plan config */
  feature: keyof PlanFeatures
  /** Override the required plan (auto-detected from feature config if not provided) */
  requiredPlan?: PlanCode
  /** The actual feature content shown when unlocked */
  children: ReactNode
  /** Custom description shown in the locked overlay */
  description?: string
  /**
   * "overlay" = blur children and show upgrade UI on top (default)
   * "replace"  = completely replace content with upgrade UI
   * "inline"   = show a small locked banner inline (no blur)
   */
  mode?: "overlay" | "replace" | "inline"
}

const PLAN_LABELS: Record<PlanCode, string> = {
  "27": "Starter ($27)",
  "47": "Growth ($47)",
  "97": "Pro ($97)",
}

const PLAN_COLORS: Record<PlanCode, string> = {
  "27": "#6366f1",
  "47": "#8b5cf6",
  "97": "#d946ef",
}

export function FeatureGate({
  feature,
  requiredPlan,
  children,
  description,
  mode = "overlay",
}: FeatureGateProps) {
  const { user } = useAuth()

  // Super admins always have full access
  if (user?.role === "super_admin") return <>{children}</>

  const planCode = user?.planCode || "27"
  const isLocked = !hasFeature(planCode, feature)

  // If user has access, render normally
  if (!isLocked) return <>{children}</>

  const targetPlan: PlanCode = requiredPlan ?? requiredPlanFor(feature) ?? "47"
  const targetPlanName = PLANS[targetPlan].name
  const targetPlanColor = PLAN_COLORS[targetPlan]
  const targetPlanLabel = PLAN_LABELS[targetPlan]

  const upgradeUrl = "/member/suscripcion"

  // ── INLINE mode: small locked banner ─────────────────────────────────────
  if (mode === "inline") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${targetPlanColor}15`, border: `1px solid ${targetPlanColor}30` }}
          >
            <Lock className="h-4 w-4" style={{ color: targetPlanColor }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {description ?? "Función bloqueada"}
            </p>
            <p className="text-xs text-muted-foreground">
              Disponible en Plan {targetPlan} — {targetPlanName}
            </p>
          </div>
        </div>
        <Link
          href={upgradeUrl}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:brightness-110"
          style={{
            backgroundColor: `${targetPlanColor}20`,
            border: `1px solid ${targetPlanColor}40`,
            color: targetPlanColor,
          }}
        >
          <Zap className="h-3 w-3" />
          Activar
        </Link>
      </div>
    )
  }

  // ── REPLACE mode: full replacement screen ────────────────────────────────
  if (mode === "replace") {
    return (
      <UpgradeScreen
        targetPlan={targetPlan}
        targetPlanLabel={targetPlanLabel}
        targetPlanColor={targetPlanColor}
        targetPlanName={targetPlanName}
        description={description}
        upgradeUrl={upgradeUrl}
      />
    )
  }

  // ── OVERLAY mode (default): blur + overlay ───────────────────────────────
  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-2xl">
      {/* Blurred preview of content */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(4px)", opacity: 0.25 }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
        <UpgradeCard
          targetPlan={targetPlan}
          targetPlanLabel={targetPlanLabel}
          targetPlanColor={targetPlanColor}
          targetPlanName={targetPlanName}
          description={description}
          upgradeUrl={upgradeUrl}
        />
      </div>
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

interface UpgradeProps {
  targetPlan: PlanCode
  targetPlanLabel: string
  targetPlanColor: string
  targetPlanName: string
  description?: string
  upgradeUrl: string
}

function UpgradeCard({
  targetPlan,
  targetPlanLabel,
  targetPlanColor,
  targetPlanName,
  description,
  upgradeUrl,
}: UpgradeProps) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-5 rounded-2xl border border-border/40 bg-card/90 p-8 text-center shadow-2xl backdrop-blur-xl">
      {/* Icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${targetPlanColor}15`,
          border: `1px solid ${targetPlanColor}30`,
        }}
      >
        <Lock className="h-6 w-6" style={{ color: targetPlanColor }} />
      </div>

      {/* Plan badge */}
      <div
        className="rounded-full px-3 py-1 text-xs font-bold"
        style={{
          backgroundColor: `${targetPlanColor}15`,
          border: `1px solid ${targetPlanColor}30`,
          color: targetPlanColor,
        }}
      >
        Plan {targetPlan} · {targetPlanName}
      </div>

      {/* Text */}
      <div className="space-y-1.5">
        <p className="text-base font-bold text-foreground">
          Función disponible en Plan {targetPlan}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Actualiza tu plan para desbloquear esta herramienta y muchas más.
        </p>
      </div>

      {/* CTA */}
      <Link
        href={upgradeUrl}
        className="group flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:brightness-110 hover:shadow-lg"
        style={{
          backgroundColor: targetPlanColor,
          boxShadow: `0 4px 20px ${targetPlanColor}30`,
        }}
      >
        <Zap className="h-4 w-4" />
        Desbloquear Plan {targetPlan}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <p className="text-[11px] text-muted-foreground/60">
        {targetPlanLabel} · Sin contratos · Cancela cuando quieras
      </p>
    </div>
  )
}

function UpgradeScreen({
  targetPlan,
  targetPlanLabel,
  targetPlanColor,
  targetPlanName,
  description,
  upgradeUrl,
}: UpgradeProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          background: `radial-gradient(ellipse at center, ${targetPlanColor}, transparent 70%)`,
        }}
      />

      <UpgradeCard
        targetPlan={targetPlan}
        targetPlanLabel={targetPlanLabel}
        targetPlanColor={targetPlanColor}
        targetPlanName={targetPlanName}
        description={description}
        upgradeUrl={upgradeUrl}
      />
    </div>
  )
}

/**
 * Lightweight hook to check if the current user has access to a feature.
 * Useful for conditional rendering without the full FeatureGate wrapper.
 */
export function useFeature(feature: keyof PlanFeatures): boolean {
  const { user } = useAuth()
  if (user?.role === "super_admin") return true
  return hasFeature(user?.planCode, feature)
}
