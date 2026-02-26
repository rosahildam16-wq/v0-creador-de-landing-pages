"use client"

import { useState, useCallback, useRef } from "react"
import { VideoPlayer } from "./experiences/exp1-video"
import { CallInterface } from "./experiences/exp3-call"
import { PsychQuiz } from "./experiences/exp2-quiz"
import { HackerTerminal } from "./experiences/exp4-hacker"
import { WhatsAppHook } from "./experiences/exp5-whatsapp"
import { LoginScreen } from "./experiences/exp6-login"
import { TikTokFeed } from "./experiences/exp7-feed"
import { SalesPage } from "./experiences/sales-page"
import { ResetLanding } from "./experiences/reset-landing"
import { DecisionVideo } from "./experiences/exp8-decision-video"
import { MunotLanding } from "./experiences/munot-landing"
import { EsclavoDigitalLanding } from "./experiences/esclavo-digital-landing"

// Order: Video(1) → Call(2) → Quiz(3) → Hacker(4) → WhatsApp(5) → Login(6) → Feed(7) → Decision(8) → Sales(9)
type Experience = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

// Step-name mapping for tracking
const STEP_NAMES: Record<Experience, string> = {
  1: "video",
  2: "llamada",
  3: "quiz",
  4: "terminal",
  5: "whatsapp",
  6: "login",
  7: "feed",
  8: "decision_video",
  9: "sales_page",
}

interface FunnelControllerProps {
  embudoId?: string
  startAt?: Experience
}

export function FunnelController({ embudoId = "nomada-vip", startAt }: FunnelControllerProps) {
  const [currentExp, setCurrentExp] = useState<Experience>(startAt || 1)

  // Allow parent to change which experience is shown
  const prevStartAt = useRef(startAt)
  if (startAt !== prevStartAt.current) {
    prevStartAt.current = startAt
    if (startAt) setCurrentExp(startAt)
  }
  const leadIdRef = useRef<string | null>(null)

  // Track a step completion in Supabase
  const trackStep = useCallback(async (step: Experience) => {
    try {
      await fetch("/api/tracking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadIdRef.current,
          step: step,
          step_name: STEP_NAMES[step],
        }),
      })
    } catch {
      // Tracking failure should not block funnel progression
    }
  }, [])

  const goToNext = useCallback(() => {
    setCurrentExp((prev) => {
      const next = (prev < 9 ? prev + 1 : prev) as Experience
      trackStep(prev) // track the completed step
      return next
    })
  }, [trackStep])

  // Called by Quiz registration to store the lead_id for tracking
  const setLeadId = useCallback((id: string) => {
    leadIdRef.current = id
  }, [])

  // Esclavo Digital Masterclass is a single landing page
  if (embudoId === "esclavo-digital-masterclass") {
    return (
      <main className="relative min-h-dvh w-full overflow-x-hidden bg-background">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <EsclavoDigitalLanding leadId={leadIdRef.current} onTrack={() => trackStep(1)} />
        </div>
      </main>
    )
  }

  // MUNOT Detox is a single landing page, not a multi-step funnel
  if (embudoId === "munot-detox") {
    return (
      <main className="relative min-h-dvh w-full overflow-x-hidden bg-background">
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
          <MunotLanding leadId={leadIdRef.current} onTrack={() => trackStep(1)} />
        </div>
      </main>
    )
  }

  // RESET landing is full-width (no max-w-md container)
  if (currentExp === 9 && embudoId === "franquicia-reset") {
    return (
      <main className="relative min-h-dvh w-full overflow-x-hidden">
        <ResetLanding leadId={leadIdRef.current} onTrack={() => trackStep(9)} />
      </main>
    )
  }

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        {currentExp === 1 && (
          <VideoPlayer
            onContinue={goToNext}
            embedUrl={embudoId === "franquicia-reset" ? undefined : undefined}
            videoSrc={embudoId === "franquicia-reset" ? "/videos/reset-intro.mp4" : (embudoId === "nomada-vip" ? "/images/nomada-3.mov" : undefined)}
          />
        )}
        {currentExp === 2 && (
          <CallInterface
            onContinue={goToNext}
            audioSrc={embudoId === "franquicia-reset" ? "/audio/oraculo-voice.mp3" : "/audio/call-voice.mp3"}
            callerName={embudoId === "franquicia-reset" ? "Oraculo" : "Mejor amigo"}
          />
        )}
        {currentExp === 3 && <PsychQuiz onContinue={goToNext} onLeadCreated={setLeadId} embudoId={embudoId} />}
        {currentExp === 4 && <HackerTerminal onContinue={goToNext} />}
        {currentExp === 5 && (
          <WhatsAppHook
            onContinue={goToNext}
            contactName={embudoId === "franquicia-reset" ? "Jorge" : "Mejor amigo"}
            customMessages={
              embudoId === "franquicia-reset"
                ? [
                  { type: "text" as const, text: "Al parecer no eres uno de ellos", sent: false },
                  { type: "text" as const, text: "Puedo confiar en ti...", sent: false },
                  { type: "text" as const, text: "He creado una arma injusta de ventas", sent: false },
                  { type: "text" as const, text: "que hace ver obsoleto cualquier embudo tradicional", sent: false },
                  { type: "audio" as const, text: "", sent: false, audioSrc: "/audio/audio-wat-llamada-3.mp3" },
                  { type: "text" as const, text: "A continuación te voy a dar el acceso privado a una cuenta de tiktok donde te explico todos los detalles", sent: false },
                  { type: "text" as const, text: "Pero no compartas esta información con nadie", sent: false },
                  { type: "text" as const, text: "Estás a punto de recibir este código secreto", sent: false },
                ]
                : undefined
            }
          />
        )}
        {currentExp === 6 && <LoginScreen onContinue={goToNext} />}
        {currentExp === 7 && (
          <TikTokFeed
            onContinue={goToNext}
            customSlides={
              embudoId === "franquicia-reset"
                ? [
                  {
                    videoEmbed: "https://player.vimeo.com/video/1167997342?api=1&badge=0&autopause=0&player_id=0&app_id=58479&controls=0&title=0&byline=0&portrait=0&playsinline=1&keyboard=0&autoplay=1&muted=1",
                    overlayText: [],
                    username: "reset.system",
                    caption: "El Arma",
                    music: "Sonido original - reset.system",
                    likes: "482.1 mil",
                    commentCount: "2,847",
                    saves: "58 mil",
                    shares: "73.5 mil",
                  },
                  {
                    videoSrc: "/videos/tiktok-2.mov",
                    overlayText: [],
                    username: "reset.system",
                    caption: "El Sistema",
                    music: "Sonido original - reset.system",
                    likes: "321.4 mil",
                    commentCount: "1,102",
                    saves: "24 mil",
                    shares: "55.2 mil",
                  },
                  {
                    videoEmbed: "https://player.vimeo.com/video/1167999493?api=1&badge=0&autopause=0&player_id=0&app_id=58479&controls=0&title=0&byline=0&portrait=0&playsinline=1&keyboard=0&autoplay=1&muted=1",
                    overlayText: [],
                    username: "reset.system",
                    caption: "Resultados",
                    music: "Sonido original - reset.system",
                    likes: "589.1 mil",
                    commentCount: "3,421",
                    saves: "67 mil",
                    shares: "88.3 mil",
                  },
                ]
                : undefined
            }
            customComments={
              embudoId === "franquicia-reset"
                ? [
                  { user: "emprendedor.digital", text: "Esto es lo que estaba buscando, los embudos normales ya no funcionan!", likes: 3241 },
                  { user: "maria_ventas", text: "Yo probe de todo y nada me daba resultados hasta que vi esto", likes: 2892 },
                  { user: "carlos.funnel", text: "Alguien mas siente que el marketing tradicional ya murio??", likes: 4104 },
                  { user: "laura_reset", text: "Me dieron acceso y no puedo creer lo que vi adentro", likes: 5421 },
                  { user: "sofi.marketing", text: "Necesito este sistema YA, como consigo el codigo?", likes: 1567 },
                  { user: "diego_automatiza", text: "Llevo 3 meses usando esto y mis ventas se triplicaron", likes: 6743 },
                  { user: "vale.negocio", text: "El arma injusta es real, lo puedo confirmar", likes: 4210 },
                  { user: "juanpa_ventas", text: "Los que siguen con embudos tradicionales van a quedarse atras", likes: 2890 },
                  { user: "camila.digital", text: "Quien mas quiere acceso? Necesitamos compartir esto!", likes: 5632 },
                  { user: "roberto_reset", text: "Esto va a cambiar la industria por completo", likes: 2987 },
                  { user: "ana.franquicia", text: "El codigo secreto funciona, acabo de entrar!!", likes: 3345 },
                  { user: "pedro_sistema", text: "Mi agencia de marketing no se compara con este sistema", likes: 1876 },
                ]
                : undefined
            }
          />
        )}
        {currentExp === 8 && embudoId === "franquicia-reset" && (
          <DecisionVideo
            onContinue={goToNext}
            videoSrc="/videos/fase8-decision.mov"
          />
        )}
        {currentExp === 8 && embudoId !== "franquicia-reset" && (
          <SalesPage leadId={leadIdRef.current} onTrack={() => trackStep(8)} />
        )}
        {currentExp === 9 && <SalesPage leadId={leadIdRef.current} onTrack={() => trackStep(9)} />}
      </div>
    </main>
  )
}
