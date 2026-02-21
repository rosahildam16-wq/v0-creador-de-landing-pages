import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"

import './globals.css'

const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const _jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
  title: 'Magic Funnel - Marketing Automation Premium',
  description: 'Convierte visitantes en clientes. La plataforma de marketing automation que las marcas premium eligen para escalar.',
}

export const viewport: Viewport = {
  themeColor: '#05010d',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className={`${_inter.variable} ${_jetbrains.variable} font-sans antialiased overflow-x-hidden`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
