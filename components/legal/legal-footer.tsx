import React from "react"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export function LegalFooter() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="w-full bg-black/40 py-12 backdrop-blur-md border-t border-white/5">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-black tracking-tighter text-white">MAGIC FUNNEL</span>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                            © {currentYear} Todos los derechos reservados
                        </p>
                    </div>

                    <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4">
                        <Link
                            href="/legal/terminos"
                            className="text-[11px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-primary"
                        >
                            Términos de Servicio
                        </Link>
                        <Link
                            href="/legal/privacidad"
                            className="text-[11px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-primary"
                        >
                            Privacidad
                        </Link>
                        <Link
                            href="/legal/cookies"
                            className="text-[11px] font-bold uppercase tracking-widest text-white/40 transition-colors hover:text-primary"
                        >
                            Cookies
                        </Link>
                    </nav>
                </div>

                <div className="mt-8 text-center md:text-left">
                    <p className="max-w-2xl text-[10px] leading-relaxed text-white/20">
                        Descargo de responsabilidad: Los resultados pueden variar de persona a persona y no son garantizados.
                        Esta plataforma es una herramienta tecnológica independiente y no está afiliada, asociada ni patrocinada por Meta, TikTok o Google.
                    </p>
                </div>
            </div>
        </footer>
    )
}
