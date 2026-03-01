import React from "react"
import { notFound } from "next/navigation"
import { getSocialCenter } from "@/lib/social-service"
import {
    Instagram,
    Twitter,
    Youtube,
    Send,
    Rocket,
    ExternalLink,
    MessageCircle,
    Smartphone,
    Globe
} from "lucide-react"

interface Props {
    params: { username: string }
}

import { LegalFooter } from "@/components/legal/legal-footer"

export default async function SocialCenterPage({ params }: Props) {
    const data = await getSocialCenter(params.username)

    if (!data) {
        notFound()
    }

    const iconMap: any = {
        rocket: <Rocket className="h-5 w-5" />,
        external: <ExternalLink className="h-5 w-5" />,
        whatsapp: <MessageCircle className="h-5 w-5" />,
        globe: <Globe className="h-5 w-5" />,
        mobile: <Smartphone className="h-5 w-5" />,
    }

    return (
        <div className="relative min-h-dvh w-full overflow-hidden bg-[#05010d] font-sans selection:bg-primary/30 selection:text-white">
            {/* ── Background Effects ── */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
            </div>

            <main className="relative z-10 mx-auto flex max-w-md flex-col items-center px-6 pb-20 pt-16">
                {/* ── Profile Header ── */}
                <div className="group relative mb-6">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary to-blue-500 opacity-75 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />
                    <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white/20 bg-neutral-900 shadow-2xl">
                        {data.avatar_url ? (
                            <img src={data.avatar_url} alt={data.display_name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-3xl font-black text-white/20">
                                {data.display_name[0]}
                            </div>
                        )}
                    </div>
                </div>

                <h1 className="mb-2 text-2xl font-black tracking-tighter text-white uppercase text-center">
                    {data.display_name}
                </h1>

                <p className="mb-10 max-w-[280px] text-center text-sm font-medium leading-relaxed text-white/50">
                    {data.bio}
                </p>

                {/* ── Links Section ── */}
                <div className="flex w-full flex-col gap-4">
                    {data.links.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border px-6 py-4 transition-all duration-300 active:scale-[0.98] ${link.highlight
                                ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] hover:border-primary hover:bg-primary/20"
                                : "border-white/5 bg-white/[0.03] backdrop-blur-md hover:border-white/20 hover:bg-white/[0.08]"
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${link.highlight ? "border-primary/30 bg-primary/20 text-primary" : "border-white/10 bg-white/5 text-white/40"
                                    }`}>
                                    {iconMap[link.icon] || <ExternalLink className="h-5 w-5" />}
                                </div>
                                <span className="text-sm font-bold text-white tracking-tight">{link.label}</span>
                            </div>
                            <div className="translate-x-4 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                                <ChevronRight className="h-4 w-4 text-white/30" />
                            </div>
                        </a>
                    ))}
                </div>

                {/* ── Social Media Icons ── */}
                <div className="mt-12 flex items-center gap-6">
                    {data.social_links.instagram && (
                        <a href={data.social_links.instagram} className="text-white/30 transition-colors hover:text-white">
                            <Instagram className="h-6 w-6" />
                        </a>
                    )}
                    {data.social_links.tiktok && (
                        <a href={data.social_links.tiktok} className="text-white/30 transition-colors hover:text-white">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47V15.5c-.01 1.61-.39 3.25-1.28 4.63-.89 1.39-2.27 2.5-3.83 3.04-1.57.54-3.37.58-4.96.06-1.59-.51-3.05-1.57-3.96-3.02-1.07-1.68-1.39-3.84-.81-5.75.58-1.92 2-3.62 3.8-4.59 1.58-.87 3.51-1.13 5.3-.61v4.13c-.38-.07-.77-.11-1.16-.11-1.17 0-2.31.52-3.1 1.4-.79.88-1.2 2.08-1.09 3.24.11 1.16.8 2.22 1.83 2.77 1.03.55 2.28.53 3.29-.02 1.01-.55 1.73-1.61 1.88-2.75.05-1.48.02-2.96.02-4.44V0h-.03z" />
                            </svg>
                        </a>
                    )}
                    {data.social_links.youtube && (
                        <a href={data.social_links.youtube} className="text-white/30 transition-colors hover:text-white">
                            <Youtube className="h-6 w-6" />
                        </a>
                    )}
                    {data.social_links.whatsapp && (
                        <a href={data.social_links.whatsapp} className="text-white/30 transition-colors hover:text-white">
                            <MessageCircle className="h-6 w-6" />
                        </a>
                    )}
                    <a href="#" className="text-white/30 transition-colors hover:text-white">
                        <Send className="h-6 w-6" />
                    </a>
                </div>

                {/* ── Brand Logo ── */}
                <div className="mt-16 flex flex-col items-center gap-1">
                    <div className="h-px w-12 bg-white/10 mb-6" />
                    <div className="flex items-center gap-2 grayscale opacity-40">
                        <div className="h-4 w-4 bg-primary rounded-full" />
                        <span className="text-[10px] font-black tracking-widest text-white uppercase">Magic Funnel</span>
                    </div>
                </div>
            </main>
            <LegalFooter />
        </div>
    )
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
