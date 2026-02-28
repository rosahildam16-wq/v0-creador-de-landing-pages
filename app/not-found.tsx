"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, ArrowLeft, Rocket } from "lucide-react"

export default function NotFound() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#020617] p-5 text-center selection:bg-primary/30">
            {/* Background Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[10%] h-[400px] w-[400px] rounded-full bg-primary/20 blur-[130px]" />
                <div className="absolute bottom-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[130px]" />
            </div>

            <div className="relative z-10 max-w-lg">
                {/* Magic Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                    }}
                    className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20"
                >
                    <Sparkles className="h-12 w-12 text-primary" />
                </motion.div>

                {/* Text Area */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="mb-4 text-6xl font-black tracking-tight text-white md:text-8xl">
                        4<span className="text-primary">0</span>4
                    </h1>
                    <h2 className="mb-6 text-xl font-bold text-white/90 md:text-2xl">
                        ¡Upps! Parece que este embudo se ha desviado.
                    </h2>
                    <p className="mb-10 text-pretty text-sm leading-relaxed text-slate-400 md:text-base">
                        La página que buscas ha desaparecido por arte de magia o nunca estuvo en este embudo. No te preocupes, te podemos llevar de vuelta al camino del éxito.
                    </p>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-4 sm:flex-row sm:justify-center"
                >
                    <Link
                        href="/"
                        className="group flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-bold text-white shadow-[0_0_25px_rgba(var(--primary-rgb),0.3)] transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Regresar al Inicio
                    </Link>

                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                    >
                        <Rocket className="h-4 w-4" />
                        Ir al Dashboard
                    </Link>
                </motion.div>

                {/* Fun Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-[10px] uppercase tracking-[0.3em] font-medium text-white/20"
                >
                    Magic Funnel . Software Real . 2026
                </motion.p>
            </div>

            {/* Grid Pattern */}
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
            />
        </main>
    )
}
