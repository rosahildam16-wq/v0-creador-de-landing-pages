import type { ReactNode } from "react"

/**
 * Funnel layout that restores the original red / green color tokens
 * so the customer-facing funnel keeps its original look.
 */
export default function FunnelLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="funnel-scope"
      style={
        {
          "--background": "0 0% 4%",
          "--foreground": "0 0% 93%",
          "--card": "0 0% 7%",
          "--card-foreground": "0 0% 93%",
          "--popover": "0 0% 7%",
          "--popover-foreground": "0 0% 93%",
          "--primary": "0 72% 51%",
          "--primary-foreground": "0 0% 100%",
          "--secondary": "0 0% 12%",
          "--secondary-foreground": "0 0% 93%",
          "--muted": "0 0% 12%",
          "--muted-foreground": "0 0% 55%",
          "--accent": "145 65% 42%",
          "--accent-foreground": "0 0% 100%",
          "--destructive": "0 84.2% 60.2%",
          "--destructive-foreground": "0 0% 98%",
          "--border": "0 0% 16%",
          "--input": "0 0% 16%",
          "--ring": "0 72% 51%",
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
