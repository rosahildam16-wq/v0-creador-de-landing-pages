"use client"

import React, { useState, useRef } from "react"
import { Eye, EyeOff } from "lucide-react"
import { playLoginKey, playLoginSuccess } from "@/lib/sounds"

interface Props {
  onContinue: () => void
}

export function LoginScreen({ onContinue }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [credentialsRevealed, setCredentialsRevealed] = useState(false)

  const generatedUserRef = useRef("usuario_11_11")
  const generatedPassRef = useRef("acc3s0_" + Math.random().toString(36).slice(2, 8))

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  React.useEffect(() => {
    const generatedUser = generatedUserRef.current
    const generatedPass = generatedPassRef.current

    const revealTimer = setTimeout(() => setCredentialsRevealed(true), 800)
    let userIdx = 0

    const userTimer = setTimeout(() => {
      const interval = setInterval(() => {
        userIdx++
        playLoginKey()
        setUsername(generatedUser.slice(0, userIdx))
        if (userIdx >= generatedUser.length) {
          clearInterval(interval)
          let passIdx = 0
          setTimeout(() => {
            const passInterval = setInterval(() => {
              passIdx++
              playLoginKey()
              setPassword(generatedPass.slice(0, passIdx))
              if (passIdx >= generatedPass.length) clearInterval(passInterval)
            }, 50)
          }, 300)
        }
      }, 50)
    }, 1600)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(userTimer)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    playLoginSuccess()
    setTimeout(() => {
      onContinue()
    }, 1500)
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center bg-black px-6 overflow-hidden">
      {/* Immersive Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[20%] w-[60%] h-[60%] rounded-full bg-[#FE2C55] opacity-[0.08] blur-[120px]" />
        <div className="absolute top-[20%] -right-[30%] w-[70%] h-[70%] rounded-full bg-[#25F4EE] opacity-[0.05] blur-[150px]" />
        <div className="absolute -bottom-[20%] left-[10%] w-[80%] h-[80%] rounded-full bg-[#FE2C55] opacity-[0.03] blur-[180px]" />
      </div>

      {/* Content wrapper for relative positioning above glows */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* TikTok top bar */}
        <div className="flex w-full items-center justify-between pb-2 pt-12">
          <button type="button" className="text-white" aria-label="Cerrar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-[15px] font-semibold text-white">Iniciar sesion</span>
          <div className="w-6" />
        </div>

        <div className="flex w-full max-w-sm flex-1 flex-col items-center justify-center">
          {/* TikTok Branding Section */}
          <div className="mb-10 flex flex-col items-center">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-[42px] font-black text-white tracking-[-0.05em] flex items-center">
                <span className="relative inline-block drop-shadow-[3px_3px_0px_#FE2C55] drop-shadow-[-3px_-3px_0px_#25F4EE]">
                  Tik Tok
                </span>
              </h2>
              <div className="h-1 w-20 rounded-full bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-1 text-center text-[22px] font-bold text-white">
            ACCESO PRIVADO
          </h1>

          <p className="mb-6 text-center text-[13px] text-neutral-500">
            {"Aqu\u00ed empieza un punto sin retorno"}
          </p>

          {/* Auto-generated credentials notice */}
          <div
            className={`mb-6 w-full rounded-sm border border-neutral-800 bg-neutral-900 px-4 py-3 transition-all duration-700 ${credentialsRevealed ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
          >
            <p className="text-center text-[12px] font-medium text-[#fe2c55]">
              {"Credenciales generadas autom\u00e1ticamente"}
            </p>
            <p className="mt-1 text-center font-mono text-[11px] text-neutral-500">
              {"Tu acceso es \u00fanico. No lo compartas."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            <div className="group relative">
              <div className="absolute inset-0 bg-neutral-800/20 rounded-xl blur-lg group-focus-within:bg-[#25F4EE]/5 transition-all" />
              <input
                id="username"
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="relative w-full rounded-xl border border-white/5 bg-neutral-900/80 px-4 py-4 text-[15px] text-white placeholder:text-neutral-600 outline-none focus:border-[#25F4EE]/30 focus:bg-neutral-900 transition-all backdrop-blur-xl"
                required
              />
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-neutral-800/20 rounded-xl blur-lg group-focus-within:bg-[#FE2C55]/5 transition-all" />
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={"Contrase\u00f1a"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-neutral-900/80 px-4 py-4 pr-12 text-[15px] text-white placeholder:text-neutral-600 outline-none focus:border-[#FE2C55]/30 focus:bg-neutral-900 transition-all backdrop-blur-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                  aria-label={showPassword ? "Ocultar" : "Mostrar"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-xl py-4 text-[15px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FE2C55] to-[#EE1D52] transition-transform group-hover:scale-105" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verificando...
                  </>
                ) : (
                  "Iniciar sesion"
                )}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex w-full max-w-sm items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-700">o</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />
          </div>

          {/* Social login options (decorative) */}
          <div className="flex w-full max-w-sm flex-col gap-2.5">
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-neutral-900/50 px-4 py-3.5 hover:bg-neutral-800 transition-all cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-[13px] font-medium text-white/90">Continuar con Google</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-neutral-900/50 px-4 py-3.5 hover:bg-neutral-800 transition-all cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.18 0-.36-.02-.53-.06-.01-.08-.02-.23-.02-.37 0-1.09.456-2.23 1.22-3.07C13.6 1.81 14.97 1.12 16.14 1c.01.14.02.29.02.43h.205zm4.563 17.57c-.32.63-.45.91-.84 1.48-.56.78-1.34 1.76-2.32 1.77-.87.01-1.1-.57-2.28-.56-1.19.01-1.44.57-2.31.57-.97-.01-1.71-.9-2.27-1.68-1.56-2.18-1.73-4.74-.76-6.1.68-.97 1.76-1.54 2.78-1.54 1.04 0 1.7.57 2.56.57.83 0 1.34-.58 2.54-.57.89 0 1.87.48 2.55 1.31-2.24 1.23-1.88 4.43.35 5.25z" />
              </svg>
              <span className="text-[13px] font-medium text-white/90">Continuar con Apple</span>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="w-full border-t border-neutral-800 py-4">
          <p className="text-center text-[13px] text-neutral-500">
            {"Al continuar, aceptas nuestros T\u00e9rminos de servicio"}
          </p>
        </div>
      </div>
    </div>
  )
}
