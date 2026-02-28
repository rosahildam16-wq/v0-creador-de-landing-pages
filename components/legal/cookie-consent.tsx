"use client"

import React, { useState, useEffect } from "react"
import { Shield, X, Check } from "lucide-react"

export function CookieConsent() {
    const [show, setShow] = useState(false)

    useEffect(() => {
        // Check if user already consented
        const consent = localStorage.getItem("mf_cookie_consent")
        if (!consent) {
            const timer = setTimeout(() => setShow(true), 2000)
            return () => clearTimeout(timer)
        }
    }, [])

    const accept = () => {
        localStorage.setItem("mf_cookie_consent", "accepted")
        setShow(false)
    }

    const decline = () => {
        localStorage.setItem("mf_cookie_consent", "declined")
        setShow(false)
    }

    if (!show) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:right-4 md:max-w-md animate-in slide-in-from-bottom-10 h-auto">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-6 shadow-2xl backdrop-blur-xl">
                {/* Glow effect */}
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />

                <div className="relative flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Tu Privacidad es Prioridad</h4>
                            <p className="text-xs leading-relaxed text-white/60">
                                Utilizamos cookies propias y de terceros para optimizar tu experiencia y analizar el tráfico para que tu funnel siempre vuele. 🚀
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={decline}
                            className="flex-1 rounded-full border border-white/10 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/5"
                        >
                            Rechazar
                        </button>
                        <button
                            onClick={accept}
                            className="flex-1 rounded-full bg-primary py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                        >
                            <Check className="h-3 w-3" />
                            Aceptar Todo
                        </button>
                        <button
                            onClick={() => setShow(false)}
                            className="absolute right-2 top-2 text-white/20 hover:text-white"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
