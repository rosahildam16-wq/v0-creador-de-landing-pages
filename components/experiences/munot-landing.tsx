"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Droplets,
  Flame,
  Heart,
  Leaf,
  Shield,
  Sparkles,
  Star,
  Zap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  leadId?: string | null
  onTrack?: () => void
}

/* ── countdown helper ── */
function useCountdown() {
  const [time, setTime] = useState({ hrs: 11, min: 59, sec: 59 })
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => {
        let { hrs, min, sec } = prev
        sec--
        if (sec < 0) { sec = 59; min-- }
        if (min < 0) { min = 59; hrs-- }
        if (hrs < 0) { hrs = 0; min = 0; sec = 0 }
        return { hrs, min, sec }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  return time
}

/* ── Ingredient card ── */
function IngredientCard({ name, tags }: { name: string; tags: string[] }) {
  return (
    <div className="group flex flex-col gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 transition-all duration-300 hover:border-emerald-500/20 hover:bg-emerald-500/10">
      <h3 className="text-sm font-bold text-foreground">{name}</h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Bonus card ── */
function BonusCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:border-emerald-500/20">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
        <Check className="h-4 w-4 text-emerald-400" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

/* ── Testimonial card ── */
function TestimonialCard({ text, name, label }: { text: string; name: string; label: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card/50 p-5">
      <span className="w-fit rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
        {label}
      </span>
      <p className="text-sm leading-relaxed text-foreground/80">{`"${text}"`}</p>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-400">
          {name.charAt(0)}
        </div>
        <span className="text-xs font-medium text-muted-foreground">{name}</span>
      </div>
    </div>
  )
}

/* ===================================================================
   MAIN COMPONENT
   =================================================================== */
export function MunotLanding({ leadId, onTrack }: Props) {
  const [tracked, setTracked] = useState(false)
  const [isSticky, setIsSticky] = useState(false)
  const countdown = useCountdown()

  useEffect(() => {
    if (!tracked && onTrack) { onTrack(); setTracked(true) }
  }, [tracked, onTrack])

  useEffect(() => {
    const h = () => setIsSticky(window.scrollY > 400)
    window.addEventListener("scroll", h)
    return () => window.removeEventListener("scroll", h)
  }, [])

  const scrollToCTA = () => {
    document.getElementById("munot-cta")?.scrollIntoView({ behavior: "smooth" })
  }

  const handleBuy = useCallback(async () => {
    if (leadId) {
      try {
        await fetch("/api/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: leadId, step: 4, step_name: "munot_cta_clicked" }),
        })
      } catch { /* don't block */ }
    }
    // For now, scroll to top with success state or redirect
    window.open("https://emmanuel.skalialatam.com/", "_blank")
  }, [leadId])

  return (
    <div className="min-h-dvh w-full bg-background text-foreground">
      {/* ════════════════════════════════════════════════
          HERO
         ════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden px-5 pb-16 pt-12">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(160 70% 40%), transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Badge */}
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
            <Leaf className="h-3 w-3" />
            Protocolo DNA Reset + Te Herbal
          </span>

          <h1 className="mb-5 text-[26px] font-bold leading-[1.15] tracking-tight text-balance">
            Desinflama tu cuerpo en 7 dias
          </h1>

          <p className="mb-8 max-w-[300px] text-[14px] leading-relaxed text-muted-foreground">
            Un protocolo guiado + te herbal funcional para desinflamar, desintoxicar y reactivar tu metabolismo para siempre.
          </p>

          {/* Feature pills */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: Droplets, label: "Detox celular" },
              { icon: Flame, label: "Metabolismo activo" },
              { icon: Leaf, label: "100% Natural" },
            ].map((f) => (
              <span key={f.label} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1 text-[11px] font-medium text-emerald-400">
                <f.icon className="h-3 w-3" />
                {f.label}
              </span>
            ))}
          </div>

          <div className="flex w-full max-w-xs flex-col gap-3">
            <Button
              onClick={scrollToCTA}
              className="w-full gap-2 bg-emerald-600 py-6 text-base font-semibold text-white hover:bg-emerald-700"
            >
              Descubrir beneficios
              <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              onClick={scrollToCTA}
              className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Diagnostico gratuito
            </button>
          </div>

          {/* Tags */}
          <div className="mt-8 flex items-center gap-3">
            {["Vegano", "Non GMO", "Natural"].map((tag) => (
              <span key={tag} className="rounded-full border border-border/40 px-3 py-1 text-[10px] font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SENALES DE ALERTA
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border px-5 py-14">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400">
          Senales de alerta
        </span>
        <h2 className="mb-8 text-xl font-bold text-balance">Tu cuerpo te esta avisando</h2>

        <div className="flex flex-col gap-2">
          {[
            "Inflamacion constante",
            "Cansancio sin explicacion",
            "Digestion pesada",
            "Retencion de liquidos",
            "Metabolismo lento",
          ].map((s) => (
            <div key={s} className="flex items-center gap-3 rounded-lg border border-amber-500/10 bg-amber-500/5 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span className="text-sm text-foreground/80">{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          3 NIVELES
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-card/30 px-5 py-14">
        <h3 className="mb-8 text-center text-sm font-bold uppercase tracking-wider text-muted-foreground">
          MUNOT trabaja en 3 niveles
        </h3>
        <div className="flex flex-col gap-4">
          {[
            { num: "01", title: "Detox", desc: "Libera toxinas a nivel celular", icon: Droplets },
            { num: "02", title: "Digestion", desc: "Restaura equilibrio intestinal", icon: Heart },
            { num: "03", title: "Metabolismo", desc: "Reactiva tu energia natural", icon: Flame },
          ].map((level) => (
            <div key={level.num} className="flex items-start gap-4 rounded-xl border border-border/40 bg-card/50 p-5">
              <span className="text-2xl font-bold text-emerald-500/30">{level.num}</span>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <level.icon className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-foreground">{level.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{level.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          RESULTADO VISUAL
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border px-5 py-14 text-center">
        <p className="mb-3 text-xs text-muted-foreground">Resultados visibles de retencion de liquido en 3 dias</p>
        <div className="mx-auto mb-4 inline-flex flex-col items-center">
          <span className="text-4xl font-bold text-foreground">70.0<span className="text-lg text-muted-foreground">kg</span></span>
          <div className="mt-2 rounded-full bg-emerald-500/10 px-4 py-1">
            <span className="text-sm font-semibold text-emerald-400">- 1 libra</span>
            <span className="ml-1 text-xs text-muted-foreground">de retencion de liquidos</span>
          </div>
        </div>
        <Button onClick={scrollToCTA} variant="outline" className="gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
          Acceder al protocolo completo
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      {/* ════════════════════════════════════════════════
          BENEFICIOS
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border px-5 py-14">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Beneficios
        </span>
        <h2 className="mb-8 text-xl font-bold text-balance">Cada taza trabaja en tu cuerpo de manera integral</h2>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Sparkles, label: "Desintoxicacion celular", sub: "Elimina metales pesados" },
            { icon: Heart, label: "Mejora digestiva", sub: "Limpieza del colon" },
            { icon: Shield, label: "Apoyo hepatico", sub: "Purificacion renal" },
            { icon: Zap, label: "Mejor absorcion", sub: "Activacion metabolica" },
          ].map((b) => (
            <div key={b.label} className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-card/50 p-3">
              <b.icon className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-semibold text-foreground">{b.label}</p>
              <p className="text-[10px] text-muted-foreground">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          INGREDIENTES
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-card/30 px-5 py-14">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Ingredientes
        </span>
        <h2 className="mb-3 text-xl font-bold text-balance">Ingredientes de alta calidad</h2>
        <p className="mb-8 text-xs leading-relaxed text-muted-foreground">
          Cada ingrediente fue seleccionado por su funcion especifica en el proceso de limpieza y restauracion interna.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <IngredientCard name="Diente de leon" tags={["Apoya el higado", "Detox profundo"]} />
          <IngredientCard name="Ganoderma" tags={["Regulacion interna", "Energia estable"]} />
          <IngredientCard name="Chaga" tags={["Antioxidante potente", "Proteccion celular"]} />
          <IngredientCard name="Jengibre" tags={["Antiinflamatorio", "Digestion activa"]} />
          <IngredientCard name="Ortiga" tags={["Purificacion renal", "Limpieza profunda"]} />
          <IngredientCard name="Lobelia" tags={["Sistema respiratorio", "Oxigenacion"]} />
        </div>

        <div className="mt-6 text-center">
          <Button onClick={scrollToCTA} variant="outline" className="gap-2 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
            Acceder al protocolo completo
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          BONOS
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border px-5 py-14">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Que incluye tu protocolo
        </span>
        <h2 className="mb-3 text-xl font-bold text-balance">Bonos por tiempo limitado.</h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Accede ahora y recibe estos bonos exclusivos que solo estan disponibles en esta oferta especial.
        </p>

        {/* Countdown */}
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-400">Esta oferta expira en:</p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">{String(countdown.hrs).padStart(2, "0")}</span>
              <span className="text-[9px] text-muted-foreground">hrs</span>
            </div>
            <span className="text-xl font-bold text-muted-foreground">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">{String(countdown.min).padStart(2, "0")}</span>
              <span className="text-[9px] text-muted-foreground">min</span>
            </div>
            <span className="text-xl font-bold text-muted-foreground">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-foreground">{String(countdown.sec).padStart(2, "0")}</span>
              <span className="text-[9px] text-muted-foreground">seg</span>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">Despues de este tiempo los bonos dejaran de estar disponibles</p>
        </div>

        <div className="flex flex-col gap-2">
          <BonusCard title="Reto DNA Reset 7 dias" desc="Protocolo guiado paso a paso" />
          <BonusCard title="Plan alimenticio" desc="Recetas desinflamatorias" />
          <BonusCard title="Mapa de activacion" desc="Hoja de ruta semanal" />
          <BonusCard title="Audios de reprogramacion" desc="Sesiones guiadas" />
          <BonusCard title="Alimentos que inflaman" desc="Guia practica" />
          <BonusCard title="Masterclass" desc="Biohacking y longevidad" />
          <BonusCard title="Comunidad privada" desc="Grupo con soporte" />
          <BonusCard title="Consultoria guiada" desc="Sesion de acompanamiento" />
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-foreground/80">Tu cuerpo ya sabe lo que necesita.</p>
          <button onClick={scrollToCTA} className="mt-2 text-xs font-medium text-emerald-400 underline-offset-2 hover:underline">
            Descubre tu estado biologico
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          OFERTA / CTA
         ════════════════════════════════════════════════ */}
      <section id="munot-cta" className="border-t border-border bg-card/30 px-5 py-14">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Oferta especial
        </span>
        <h2 className="mb-6 text-xl font-bold text-balance">Empieza tu reset biologico hoy</h2>

        <div className="rounded-2xl border border-emerald-500/20 bg-card/60 p-6 text-center">
          {/* Price */}
          <div className="mb-4">
            <span className="text-sm text-muted-foreground line-through">$197 USD</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-emerald-400">$27</span>
              <span className="text-sm text-muted-foreground">USD</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">Pago unico | Protocolo + bonos + te incluido</p>
          </div>

          {/* Trust badges */}
          <div className="mb-6 flex flex-col gap-2">
            {[
              "Cupos limitados por dia",
              "Garantia 7 dias, devolucion completa",
              "100% natural, vegano y non-GMO",
              "Producto enviado contraentrega",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="text-xs text-foreground/70">{t}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleBuy}
            className="w-full gap-2 bg-emerald-600 py-6 text-base font-semibold text-white hover:bg-emerald-700"
          >
            Acceder ahora al protocolo completo
            <ArrowRight className="h-5 w-5" />
          </Button>

          <p className="mt-3 text-[10px] text-muted-foreground">
            Acceso inmediato a todo el contenido digital + envio del te.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          TESTIMONIOS
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border px-5 py-14">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Testimonios reales
        </span>
        <h2 className="mb-8 text-xl font-bold text-balance">Lo que dicen quienes ya lo probaron</h2>

        <div className="flex flex-col gap-3">
          <TestimonialCard
            label="Resultados"
            text="Despues de una semana baje 3 libras y ahora me siento mas ligero, mas desinflamado y con mas energia."
            name="Jorge L."
          />
          <TestimonialCard
            label="Desinflamacion"
            text="Desde que consumo el Mono T mi cuerpo se desinflamo, ya no tengo antojos de azucar y mi energia aumento."
            name="Nicolas Row"
          />
          <TestimonialCard
            label="Digestion"
            text="Despues de 2 semanas me siento mucho mas ligera. La pesadez despues de comer desaparecio."
            name="Maria G."
          />
          <TestimonialCard
            label="Energia"
            text="Lo tomo cada manana como ritual. Mi energia cambio, me siento mas activo sin necesidad de tanta cafeina."
            name="Carlos R."
          />
          <TestimonialCard
            label="Inflamacion"
            text="Sentia mi cuerpo inflamado todo el tiempo. Con MUNOT note la diferencia desde la primera semana."
            name="Ana L."
          />
          <TestimonialCard
            label="Calidad"
            text="Lo mejor es que es natural y se siente. No es como otros productos que prometen y no entregan nada."
            name="Roberto M."
          />
          <TestimonialCard
            label="Piel"
            text="Mi piel se ve diferente, mas limpia. Y ya no me siento hinchada despues de cada comida."
            name="Laura S."
          />
          <TestimonialCard
            label="Familia"
            text="Le regale el protocolo a mi mama y me dice que siente mucha mas energia desde la primera semana."
            name="Diego P."
          />
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          COMPARATIVA
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border bg-card/30 px-5 py-14">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Comparativa
        </span>
        <h2 className="mb-8 text-xl font-bold">No es otro te.</h2>

        <div className="flex flex-col gap-4">
          {/* Otros tes */}
          <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-5">
            <h3 className="mb-3 text-sm font-bold text-foreground">Otros tes</h3>
            <div className="flex flex-col gap-2">
              {[
                "Ingredientes genericos",
                "Sin proposito funcional",
                "Sabor como unica promesa",
                "Sin respaldo cientifico",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/60" />
                  <span className="text-xs text-foreground/60">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MUNOT */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <h3 className="mb-3 text-sm font-bold text-emerald-400">MUNOT</h3>
            <div className="flex flex-col gap-2">
              {[
                "Formula funcional disenada",
                "Ingredientes seleccionados",
                "Proposito metabolico claro",
                "Uso estrategico y con respaldo",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="text-xs text-foreground/80">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FAQ
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border px-5 py-14">
        <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          FAQ
        </span>
        <h2 className="mb-8 text-xl font-bold">Preguntas frecuentes</h2>

        <div className="flex flex-col gap-2">
          {[
            { q: "Que hace exactamente MUNOT?", a: "MUNOT es una infusion herbal funcional que trabaja en 3 niveles: detox celular, mejora digestiva y activacion metabolica. Cada ingrediente fue seleccionado por su funcion especifica." },
            { q: "Cuanto tiempo tarda en hacer efecto?", a: "Los primeros resultados visibles de retencion de liquido se notan en 3 dias. El protocolo completo de 7 dias trabaja a nivel celular para desinflamar tu cuerpo." },
            { q: "Como debo tomar MUNOT?", a: "Una taza al dia, preferiblemente en las mananas. El protocolo incluye instrucciones paso a paso para maximizar los resultados." },
            { q: "Quien puede tomar MUNOT?", a: "MUNOT es apto para adultos. Es vegano, non-GMO y 100% natural. Si tienes alguna condicion medica, consulta con tu medico." },
            { q: "Es seguro y natural?", a: "Si. Todos los ingredientes son naturales, sin aditivos ni quimicos. MUNOT es vegano y non-GMO." },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-xl border border-border/40 bg-card/50">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-3.5 text-sm font-medium text-foreground">
                {faq.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-4 pb-4">
                <p className="text-xs leading-relaxed text-muted-foreground">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
         ════════════════════════════════════════════════ */}
      <section className="border-t border-border px-5 py-14 text-center">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Tu cuerpo lo esta pidiendo
        </p>
        <h2 className="mb-4 text-xl font-bold text-balance">Tu cuerpo necesita reiniciar.</h2>
        <p className="mb-6 text-sm text-muted-foreground">Empieza hoy con una taza. Tu bienestar lo vale.</p>

        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={handleBuy}
            className="gap-2 bg-emerald-600 px-8 py-6 text-base font-semibold text-white hover:bg-emerald-700"
          >
            Comenzar mi reset
            <ArrowRight className="h-5 w-5" />
          </Button>
          <button
            onClick={handleBuy}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Comprar MUNOT
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border px-5 py-8 text-center">
        <p className="text-[10px] text-muted-foreground">MUNOT | Infusion Herbal Detox Metabolica</p>
      </footer>

      {/* ── STICKY CTA ── */}
      {isSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
          <div className="mx-auto max-w-md">
            <Button
              onClick={scrollToCTA}
              className="w-full gap-2 bg-emerald-600 py-5 text-base font-semibold text-white hover:bg-emerald-700"
            >
              <Leaf className="h-4 w-4" />
              Acceder al protocolo - $27 USD
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
