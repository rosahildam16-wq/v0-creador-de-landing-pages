"use client"

import React from "react"
import Link from "next/link"
import {
    Sparkles,
    Zap,
    ShieldCheck,
    Users,
    BarChart3,
    MessageSquare,
    Globe,
    ArrowRight,
    Check,
    Minus,
    Star,
    Bot
} from "lucide-react"

const COMPARISON = [
    { feature: "IA Prospectora Integrada", mf: true, others: false },
    { feature: "Embudos de WhatsApp Premium", mf: true, others: false },
    { feature: "Analítica de Meta Ads Directa", mf: true, others: "Parcial" },
    { feature: "Configuración en < 5 Minutos", mf: true, others: false },
    { feature: "Soporte en Español Elite", mf: true, others: false },
    { feature: "Automatización Todo-en-Uno", mf: true, others: "Múltiples Apps" },
]

export function MainLanding() {
    return (
        <div className="min-h-screen bg-[#05010d] text-white selection:bg-primary selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-[#05010d]/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-600 shadow-lg shadow-primary/20">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xl font-black italic tracking-tighter uppercase">Magic Funnel</span>
                    </div>
                    <div className="hidden items-center gap-8 md:flex">
                        <a href="#beneficios" className="text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Beneficios</a>
                        <a href="#comparativa" className="text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Comparativa</a>
                        <a href="#testimonios" className="text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">Testimonios</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold uppercase tracking-widest text-white hover:opacity-80 transition-opacity">Entrar</Link>
                        <Link href="/login?mode=register" className="rounded-full bg-white px-6 py-2.5 text-xs font-black uppercase italic tracking-widest text-black shadow-lg shadow-white/10 transition-all hover:scale-105 active:scale-95">Registrar</Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
                {/* Ambient Glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-4xl bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 h-[400px] w-[400px] bg-fuchsia-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="relative z-10 flex flex-col items-start text-left">
                            <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 backdrop-blur-md">
                                <Bot className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Marketing con IA Elite</span>
                            </div>
                            <h1 className="mb-6 text-5xl md:text-7xl font-black italic leading-[0.9] tracking-tighter uppercase whitespace-pre-line">
                                La Magia de <span className="premium-gradient-text">Escalar con IA</span>
                            </h1>
                            <p className="mb-10 text-lg md:text-xl text-white/60 font-medium leading-relaxed max-w-lg">
                                Deja de pelear con herramientas complejas. Magic Funnel combina <span className="text-white">inteligencia artificial</span>, embudos de alta conversión y analítica avanzada en su sistema diseñado para el mercado hispano.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                <Link href="/login?mode=register" className="group flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-primary px-8 py-5 text-lg font-black italic text-white shadow-xl shadow-primary/25 transition-all hover:scale-[1.03] active:scale-95">
                                    COMENZAR LA MAGIA
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <Link href="#comparativa" className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-white/10">
                                    Ver Comparativa
                                </Link>
                            </div>
                        </div>

                        <div className="relative z-10 animate-fade-in">
                            <div className="relative rounded-[2.5rem] border border-white/10 bg-black/40 p-4 backdrop-blur-3xl glass-card-float">
                                <div className="absolute -inset-1 rounded-[2.6rem] bg-gradient-to-br from-primary/30 to-fuchsia-600/30 blur opacity-20" />
                                <img
                                    src="/magic_funnel_hero_concept.png"
                                    alt="Magic Funnel Dashboard"
                                    className="rounded-[2rem] w-full shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Comparison Section */}
            <section id="comparativa" className="py-24 bg-white/[0.02] border-y border-white/5">
                <div className="mx-auto max-w-4xl px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">¿Por qué <span className="text-primary italic-none">somos diferentes?</span></h2>
                        <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Adiós a las herramientas genéricas</p>
                    </div>

                    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a]/50 backdrop-blur-xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-8 py-6 text-sm font-black uppercase tracking-widest text-white/40">Funcionalidad</th>
                                    <th className="px-8 py-6 text-sm font-black uppercase tracking-widest text-primary">Magic Funnel</th>
                                    <th className="px-8 py-6 text-sm font-black uppercase tracking-widest text-white/20 text-center">Otros (Manychat, GHL, etc)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON.map((row, i) => (
                                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-8 py-5 text-sm font-bold text-white/80">{row.feature}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2 text-primary font-black italic">
                                                <Check className="h-5 w-5" />
                                                <span className="text-xs uppercase">Si</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2 text-white/20">
                                                {typeof row.others === "string" ? (
                                                    <span className="text-[10px] uppercase font-black">{row.others}</span>
                                                ) : row.others ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <Minus className="h-5 w-5" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section id="beneficios" className="py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="p-10 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-primary/20 transition-all">
                            <div className="mb-6 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Globe className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-white">Mercado Hispano Elite</h3>
                            <p className="text-white/50 text-sm leading-relaxed">
                                Diseñado específicamente para las sutilezas y disparadores psicológicos que convierten en Latinoamérica y España. No es una traducción, es nativo.
                            </p>
                        </div>

                        <div className="p-10 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-primary/20 transition-all">
                            <div className="mb-6 h-14 w-14 rounded-2xl bg-fuchsia-600/10 flex items-center justify-center">
                                <BarChart3 className="h-8 w-8 text-fuchsia-600" />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-white">Analítica Predictiva</h3>
                            <p className="text-white/50 text-sm leading-relaxed">
                                Entiende qué campañas de Meta Ads están trayendo socios reales, no solo clics vacíos. Data real para decisiones inteligentes.
                            </p>
                        </div>

                        <div className="p-10 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-primary/20 transition-all">
                            <div className="mb-6 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Zap className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-white">IA Todo-en-Uno</h3>
                            <p className="text-white/50 text-sm leading-relaxed">
                                Desde la prospección en frío hasta el seguimiento por WhatsApp, la IA de Magic Funnel trabaja 24/7 mientras tú haces crecer tu marca.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonios" className="py-24 bg-primary/[0.01]">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 italic">Voces de <span className="text-primary italic-none">Líderes</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { name: "Alejandro V.", role: "Top Earner", text: "Magic Funnel cambió mi forma de prospectar. Pasé de enviar 100 mensajes manuales a recibir 10 leads calificados al día en automático." },
                            { name: "Mariana R.", role: "Agencia Elite", text: "La integración con Meta Ads es lo que faltaba. Por fin puedo ver el ROI real de mis campañas de WhatsApp sin morir en el intento." },
                            { name: "Carlos D.", role: "Empresario", text: "El sistema de IA es asombroso. Responde dudas técnicas y filtra a los curiosos para que yo solo hable con los que están listos para invertir." }
                        ].map((t, i) => (
                            <div key={i} className="p-8 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-sm">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
                                </div>
                                <p className="text-white/80 font-medium italic mb-6 leading-relaxed">"{t.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/40 to-white/10 flex items-center justify-center font-black text-xs">
                                        {t.name[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase text-white">{t.name}</span>
                                        <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t.role}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 blur-[150px] rounded-full translate-y-20 pointer-events-none" />
                <div className="mx-auto max-w-3xl px-6 text-center">
                    <h2 className="text-5xl md:text-7xl font-black italic uppercase leading-[0.9] tracking-tighter mb-8">
                        ¿Listo para <br /> <span className="premium-gradient-text">Hacer Magia?</span>
                    </h2>
                    <p className="text-white/60 mb-12 text-lg font-medium">
                        Únete a la nueva generación de marketeros que usan IA para escalar su libertad. Sin contratos, sin complicaciones.
                    </p>
                    <Link href="/login?mode=register" className="inline-flex items-center gap-4 rounded-3xl bg-white px-12 py-6 text-xl font-black italic text-black shadow-2xl shadow-white/10 transition-all hover:scale-105 active:scale-95">
                        CREAR MI CUENTA ELITE
                        <ArrowRight className="h-6 w-6" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-white/5">
                <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-2 grayscale brightness-200">
                        <Sparkles className="h-5 w-5 text-white" />
                        <span className="text-sm font-black italic tracking-tighter uppercase">Magic Funnel</span>
                    </div>
                    <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">
                        <span>© 2026 MAGIC FUNNEL</span>
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-white transition-colors">Términos</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
