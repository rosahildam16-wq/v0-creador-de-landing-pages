"use client"

import React from "react"
import {
    Rocket,
    ShieldCheck,
    Zap,
    ChevronRight,
    PlayCircle,
    Users,
    Star,
    TrendingUp,
    MessageSquare,
    Globe,
    Layers,
    Layout
} from "lucide-react"

export default function MagicFunnelSalesPage() {
    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0a0118] text-white selection:bg-primary/30">
            {/* ── Background Gradients ── */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-5%] h-[40%] w-[40%] rounded-full bg-primary/20 blur-[130px]" />
                <div className="absolute bottom-[5%] right-[-5%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[130px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            </div>

            {/* ── Navigation ── */}
            <nav className="relative z-50 flex items-center justify-between px-6 py-6 border-b border-white/5 backdrop-blur-md sticky top-0">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                    <span className="text-sm font-black tracking-widest uppercase">Magic Funnel</span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-white/50">
                    <a href="#features" className="hover:text-white transition-colors">Sistema</a>
                    <a href="#results" className="hover:text-white transition-colors">Resultados</a>
                    <a href="#testimonials" className="hover:text-white transition-colors">Testimonios</a>
                </div>
                <a href="/login" className="px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all">
                    Acceso VIP
                </a>
            </nav>

            {/* ── Hero Section ── */}
            <section className="relative z-10 mx-auto max-w-7xl px-6 pt-20 pb-32 text-center md:pt-32">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-8">
                    <SparkleIcon className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">El futuro de las ventas digitales</span>
                </div>

                <h1 className="mx-auto max-w-4xl text-5xl font-black tracking-tighter sm:text-7xl lg:text-8xl mb-8 leading-[0.9]">
                    ESCRIBRE TU PROPIA <span className="text-primary italic">HISTORIA DE ÉXITO</span> CON EMBUDOS MÁGICOS
                </h1>

                <p className="mx-auto max-w-2xl text-lg font-medium text-white/50 mb-12 leading-relaxed">
                    No es solo un embudo. Es una <span className="text-white">experiencia inmersiva</span> diseñada para convertir desconocidos en clientes leales de forma automática, utilizando psicología de ventas de alto impacto.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-primary text-sm font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(var(--primary-rgb),0.4)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                        Comenzar Ahora
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-white/10 bg-white/5 text-sm font-black uppercase tracking-widest backdrop-blur-md transition-all hover:bg-white/10 flex items-center justify-center gap-2">
                        <PlayCircle className="h-5 w-5" />
                        Ver Demo
                    </button>
                </div>
            </section>

            {/* ── Main Feature Grid ── */}
            <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 py-32 border-t border-white/5">
                <div className="grid gap-12 lg:grid-cols-12 items-center">
                    <div className="lg:col-span-5 space-y-8">
                        <h2 className="text-4xl font-black tracking-tighter sm:text-5xl leading-tight">
                            UN SISTEMA INTEGRADO TOTALMENTE <span className="text-primary italic">AUTOPILOTADO</span>
                        </h2>
                        <div className="space-y-6">
                            {[
                                { title: "Magic CRM", desc: "Gestión inteligente de prospectos con seguimiento automático.", icon: <Layers className="h-5 w-5" /> },
                                { title: "Social Center", desc: "Tu marca personal optimizada para la máxima conversión en redes.", icon: <Globe className="h-5 w-5" /> },
                                { title: "Smart Scheduling", desc: "Citas automáticas integradas con Zoom y Google Calendar.", icon: <Zap className="h-5 w-5" /> }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-5 rounded-3xl border border-white/5 bg-white/[0.02] transition-colors hover:border-white/10 group">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                                        <p className="text-sm text-white/50 leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="lg:col-span-7">
                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-neutral-800 to-neutral-950 p-[1px] shadow-2xl">
                            {/* MOCK UI IMAGE */}
                            <div className="absolute inset-0 bg-[#0c031d] rounded-[23px] overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
                                    alt="Dashboard"
                                    className="opacity-40 object-cover h-full w-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 backdrop-blur-md animate-pulse">
                                        <PlayCircle className="h-10 w-10 text-primary" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section id="testimonials" className="relative z-10 mx-auto max-w-7xl px-6 py-32 border-y border-white/5 bg-primary/[0.02]">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 italic">LO QUE DICEN NUESTROS <span className="text-primary NOT-ITALIC">LÍDERES</span></h2>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Cientos de emprendedores ya están escalando</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {[
                        { name: "Andrés G.", role: "Elite Member", text: "Magic Funnel cambió mi forma de vender. Pasé de perseguir gente a recibir notificaciones de citas a toda hora.", avatar: "A" },
                        { name: "Lucía M.", role: "Team Leader", text: "La integración con WhatsApp es una locura. Los prospectos llegan calificados y listos para comprar.", avatar: "L" },
                        { name: "Carlos R.", role: "Pro User", text: "El Social Center es exquisito. Mi bio de Instagram ahora parece un ecosistema de ventas profesional.", avatar: "C" }
                    ].map((t, i) => (
                        <div key={i} className="p-8 rounded-[40px] border border-white/5 bg-white/[0.03] backdrop-blur-sm relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform">
                                <MessageSquare className="h-12 w-12 text-primary" />
                            </div>
                            <div className="flex items-center gap-1 mb-6">
                                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="h-3 w-3 fill-primary text-primary" />)}
                            </div>
                            <p className="text-white/70 italic mb-8 leading-relaxed font-medium">"{t.text}"</p>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 font-black">
                                    {t.avatar}
                                </div>
                                <div>
                                    <h5 className="font-bold text-sm">{t.name}</h5>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Social Proof / Results ── */}
            <section id="results" className="relative z-10 mx-auto max-w-7xl px-6 py-32 text-center">
                <h2 className="text-6xl font-black italic tracking-tighter mb-16 uppercase">RESULTADOS <span className="text-primary not-italic">REALES</span></h2>
                <div className="grid gap-8 md:grid-cols-4">
                    {[
                        { label: "Leads Generados", value: "24k+", icon: <Users className="h-5 w-5" /> },
                        { label: "Citas Agendadas", value: "8.2k+", icon: <Zap className="h-5 w-5" /> },
                        { label: "Ventas Totales", value: "$450k+", icon: <TrendingUp className="h-5 w-5" /> },
                        { label: "Miembros VIP", value: "1.2k+", icon: <ShieldCheck className="h-5 w-5" /> }
                    ].map((s, i) => (
                        <div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/[0.02]">
                            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6">
                                {s.icon}
                            </div>
                            <div className="text-4xl font-black mb-1">{s.value}</div>
                            <div className="text-[10px] uppercase tracking-widest text-white/30 font-black">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Footer / CTA ── */}
            <section className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center">
                <div className="p-16 rounded-[60px] bg-gradient-to-br from-primary to-blue-700 relative overflow-hidden shadow-[0_0_100px_rgba(var(--primary-rgb),0.3)]">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <h2 className="relative text-4xl sm:text-6xl font-black tracking-tighter mb-8 max-w-2xl mx-auto leading-[0.9]">¿LISTO PARA ESCALAR TU NEGOCIO AL INFINITO?</h2>
                    <p className="relative text-white/80 font-medium mb-12 max-w-md mx-auto">Únete hoy a la élite de emprendedores que dominan el mercado con Magic Funnel.</p>
                    <button className="relative px-12 py-6 rounded-2xl bg-white text-black text-sm font-black uppercase tracking-widest shadow-2xl transition-transform hover:scale-105 active:scale-95">
                        Empezar Experiencia VIP
                    </button>
                </div>
            </section>

            {/* ── Mini Footer ── */}
            <footer className="relative z-10 py-12 border-t border-white/5 text-center">
                <div className="flex items-center justify-center gap-2 opacity-30">
                    <div className="h-3 w-3 bg-primary rounded-full" />
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase">Magic Funnel Systems</span>
                </div>
                <p className="text-[9px] text-white/20 mt-4 uppercase tracking-tighter font-bold">© 2024 Skalia. Todos los derechos reservados.</p>
            </footer>
        </div>
    )
}

function SparkleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}
