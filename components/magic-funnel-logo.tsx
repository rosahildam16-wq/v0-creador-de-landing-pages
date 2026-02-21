"use client"

interface MagicFunnelLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  animated?: boolean
  className?: string
}

const sizeMap = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 40, text: "text-2xl" },
  lg: { icon: 56, text: "text-4xl" },
  xl: { icon: 72, text: "text-5xl" },
}

export function MagicFunnelLogo({
  size = "md",
  showText = true,
  animated = true,
  className = "",
}: MagicFunnelLogoProps) {
  const s = sizeMap[size]

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {animated && (
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-60"
            style={{
              background: "radial-gradient(circle, #d946ef 0%, #a855f7 50%, transparent 70%)",
              animation: "mf-logo-glow 3s ease-in-out infinite",
            }}
          />
        )}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 72 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10"
        >
          <defs>
            <linearGradient id="funnel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <linearGradient id="spark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer circle */}
          <circle cx="36" cy="36" r="34" stroke="url(#funnel-grad)" strokeWidth="2" fill="none" opacity="0.3" />

          {/* Funnel body */}
          <path
            d="M18 18L54 18L42 38L42 52L30 56L30 38Z"
            fill="url(#funnel-grad)"
            opacity="0.9"
          />

          {/* Funnel highlight */}
          <path
            d="M20 18L36 18L30 38L30 50L28 51L28 38Z"
            fill="white"
            opacity="0.15"
          />

          {/* Magic sparkles */}
          <g filter="url(#glow)">
            <circle cx="24" cy="12" r="2" fill="url(#spark-grad)">
              {animated && (
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx="52" cy="14" r="1.5" fill="url(#spark-grad)">
              {animated && (
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx="58" cy="28" r="1.8" fill="url(#spark-grad)">
              {animated && (
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx="14" cy="30" r="1.3" fill="url(#spark-grad)">
              {animated && (
                <animate attributeName="opacity" values="1;0.4;1" dur="3s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx="48" cy="50" r="1.5" fill="url(#spark-grad)">
              {animated && (
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite" />
              )}
            </circle>
          </g>

          {/* Drop coming out */}
          <ellipse cx="36" cy="62" rx="4" ry="3" fill="url(#funnel-grad)" opacity="0.7">
            {animated && (
              <animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </ellipse>
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`${s.text} font-bold tracking-tight bg-clip-text text-transparent`}
            style={{
              backgroundImage: "linear-gradient(135deg, #a855f7 0%, #d946ef 50%, #ec4899 100%)",
            }}
          >
            Magic Funnel
          </span>
        </div>
      )}
    </div>
  )
}
