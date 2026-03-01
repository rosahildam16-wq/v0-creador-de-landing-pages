"use client"

import React, { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, Minus } from "lucide-react"

export function MagicSupportAI() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant", content: string }[]>([
        {
            role: "assistant",
            content: "¡Hola! Soy tu Asistente Mágico de Crecimiento. 🪄✨ Estoy aquí para ayudarte a configurar tus embudos, atraer más socios o resolver cualquier duda técnica. \n\n¿En qué podemos hacer magia hoy? 🚀"
        }
    ])

    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [chatHistory])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || isLoading) return

        const userMsg = message.trim()
        setMessage("")
        setChatHistory(prev => [...prev, { role: "user", content: userMsg }])
        setIsLoading(true)

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg, history: chatHistory.slice(-6) })
            })
            const data = await res.json()

            if (data.response) {
                setChatHistory(prev => [...prev, { role: "assistant", content: data.response }])
            }
        } catch (err) {
            setChatHistory(prev => [...prev, { role: "assistant", content: "Lo siento, tuve un problema de conexión. 🚀" }])
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-[9999] group flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-fuchsia-600 shadow-[0_10px_30px_-10px_rgba(var(--primary-rgb),0.5)] transition-all hover:scale-110 active:scale-95 animate-in zoom-in"
            >
                <div className="absolute inset-0 rounded-2xl bg-primary animate-ping opacity-20 group-hover:opacity-0" />
                <div className="relative">
                    <Bot className="h-8 w-8 text-white" />
                    <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-white animate-pulse" />
                </div>
            </button>
        )
    }

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] w-[90vw] md:w-[400px] flex flex-col transition-all duration-300 ${isMinimized ? "h-16" : "h-[70vh] md:h-[600px]"} animate-in slide-in-from-bottom-10`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 rounded-t-2xl bg-gradient-to-r from-primary to-fuchsia-700 border-b border-white/10 shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                        <Bot className="h-5 w-5 text-white" />
                        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-white leading-tight uppercase tracking-widest">Magic IA Support</span>
                        <span className="text-[10px] text-white/70 font-bold uppercase tracking-tighter">Tu copiloto de crecimiento</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                        <Minus className="h-4 w-4 text-white" />
                    </button>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                        <X className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Chat Body */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]/95 backdrop-blur-xl border-x border-white/5"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {chatHistory.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                            >
                                <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${msg.role === "user" ? "bg-primary/20 border-primary/20" : "bg-white/5 border-white/10"
                                        }`}>
                                        {msg.role === "user" ? <User className="h-4 w-4 text-primary" /> : <Bot className="h-4 w-4 text-white/50" />}
                                    </div>
                                    <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed ${msg.role === "user"
                                        ? "bg-primary text-white rounded-tr-none font-medium"
                                        : "bg-white/[0.03] text-white/80 border border-white/5 rounded-tl-none"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in">
                                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 p-3 rounded-2xl">
                                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                    <span className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Magic IA está pensando...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Input */}
                    <form
                        onSubmit={handleSendMessage}
                        className="p-4 bg-[#0a0a0a]/98 rounded-b-2xl border-t border-white/5 flex gap-2"
                    >
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Pregunta lo que sea..."
                            disabled={isLoading}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !message.trim()}
                            className="bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition-all active:scale-95"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </>
            )}
        </div>
    )
}
