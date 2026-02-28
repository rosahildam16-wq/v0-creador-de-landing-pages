"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Quote as QuoteIcon, Heart, Star, Sun } from "lucide-react"
import { DAILY_QUOTES, Quote } from "@/lib/quotes-data"

// Subtle notification/sparkle sound (base64)
const NOTIFICATION_SOUND = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YT9vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT= "

export function DailyQuotePopup() {
    const [show, setShow] = useState(false)
    const [quote, setQuote] = useState<Quote | null>(null)

    useEffect(() => {
        const sessionKey = "mf_quote_shown_session"
        const sessionShown = sessionStorage.getItem(sessionKey)

        if (!sessionShown) {
            const idx = (new Date().getFullYear() * 365 + new Date().getMonth() * 31 + new Date().getDate()) % DAILY_QUOTES.length
            setQuote(DAILY_QUOTES[idx])

            // Delay it slightly for entry effect
            const timer = setTimeout(() => {
                setShow(true)
                sessionStorage.setItem(sessionKey, "true")

                // Play subtle sound
                try {
                    const audio = new Audio(NOTIFICATION_SOUND)
                    audio.volume = 0.2
                    audio.play()
                } catch { /* Safari/privacy blocks auto-audio usually */ }
            }, 1500)

            return () => clearTimeout(timer)
        }
    }, [])

    if (!quote) return null

    const getIcon = () => {
        switch (quote.type) {
            case "spiritual": return <QuoteIcon className="text-amber-400" size={24} />
            case "motivational": return <Sparkles className="text-violet-400" size={24} />
            case "financial": return <Star className="text-emerald-400" size={24} />
            case "growth": return <Sun className="text-blue-400" size={24} />
            default: return <QuoteIcon size={24} />
        }
    }

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-card/60 p-8 shadow-2xl backdrop-blur-2xl lg:p-12"
                    >
                        {/* Background elements */}
                        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
                        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent/10 blur-[80px]" />

                        <button
                            onClick={() => setShow(false)}
                            className="absolute right-6 top-6 p-2 text-muted-foreground/40 transition-colors hover:text-foreground hover:bg-white/5 rounded-full"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative flex flex-col items-center text-center">
                            <motion.div
                                initial={{ rotate: -10, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ delay: 0.3, type: "spring" }}
                                className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10"
                            >
                                {getIcon()}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mb-8"
                            >
                                <div className="mb-4 text-[10px] font-bold text-primary/40 tracking-[0.2em] uppercase">
                                    {quote.type === "spiritual" ? "Inspiración del día" : "Mensaje de hoy"}
                                </div>
                                <h2 className="text-2xl font-bold leading-relaxed text-foreground md:text-[1.75rem] italic">
                                    &ldquo;{quote.text}&rdquo;
                                </h2>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="flex flex-col items-center gap-6"
                            >
                                <div className="text-sm font-semibold text-muted-foreground">
                                    — {quote.author}
                                </div>

                                <button
                                    onClick={() => setShow(false)}
                                    className="premium-submit-btn w-40 flex items-center justify-center py-3 rounded-full text-sm font-bold text-white transition-all shadow-lg hover:shadow-primary/20"
                                >
                                    Continuar
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
