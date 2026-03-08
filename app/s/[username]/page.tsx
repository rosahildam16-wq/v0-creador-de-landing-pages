import React from "react"
import { notFound } from "next/navigation"
import { getSocialCenter, incrementSocialViews } from "@/lib/social-service"
import {
    Instagram,
    Youtube,
    Rocket,
    ExternalLink,
    MessageCircle,
    Globe,
    Facebook,
    Linkedin,
    Twitter,
    ChevronRight,
    Phone,
    Mail,
    ShoppingBag,
    FileText,
    Smartphone,
} from "lucide-react"
import { LegalFooter } from "@/components/legal/legal-footer"

interface Props {
    params: Promise<{ username: string }>
}

function TikTokIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
        </svg>
    )
}

export default async function SocialCenterPage({ params }: Props) {
    const { username } = await params
    const data = await getSocialCenter(username)

    if (!data) {
        notFound()
    }

    // Increment views — fire and forget
    incrementSocialViews(username).catch(() => {})

    const primary = data.theme_config?.primary_color || "#8b5cf6"
    const bgStyle = data.theme_config?.bg_style || "glass_mesh"
    const buttonStyle = data.theme_config?.button_style || "glass"

    const iconMap: Record<string, React.ReactNode> = {
        rocket: <Rocket className="h-5 w-5" />,
        external: <ExternalLink className="h-5 w-5" />,
        whatsapp: <MessageCircle className="h-5 w-5" />,
        globe: <Globe className="h-5 w-5" />,
        instagram: <Instagram className="h-5 w-5" />,
        youtube: <Youtube className="h-5 w-5" />,
        facebook: <Facebook className="h-5 w-5" />,
        linkedin: <Linkedin className="h-5 w-5" />,
        twitter: <Twitter className="h-5 w-5" />,
        phone: <Phone className="h-5 w-5" />,
        mail: <Mail className="h-5 w-5" />,
        shop: <ShoppingBag className="h-5 w-5" />,
        form: <FileText className="h-5 w-5" />,
        mobile: <Smartphone className="h-5 w-5" />,
    }

    // Background configs per style
    const bgConfigs: Record<string, { bg: string; orb1Color: string; orb2Color: string; noise: boolean }> = {
        glass_mesh: {
            bg: "#05010d",
            orb1Color: `${primary}40`,
            orb2Color: "#3b82f620",
            noise: true,
        },
        dark_minimal: {
            bg: "#0a0a0a",
            orb1Color: `${primary}18`,
            orb2Color: "transparent",
            noise: false,
        },
        neon_glow: {
            bg: "#030309",
            orb1Color: `${primary}60`,
            orb2Color: `${primary}35`,
            noise: false,
        },
        aurora: {
            bg: "#020d08",
            orb1Color: "#10b98138",
            orb2Color: `${primary}28`,
            noise: true,
        },
        gradient_bold: {
            bg: "#0f0518",
            orb1Color: `${primary}50`,
            orb2Color: "#ec489945",
            noise: false,
        },
    }

    const cfg = bgConfigs[bgStyle] ?? bgConfigs.glass_mesh

    // Link class helpers based on button_style
    const getLinkClasses = (highlight: boolean): string => {
        const base = "group relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-6 py-4 transition-all duration-300 active:scale-[0.98]"
        if (buttonStyle === "solid") {
            return `${base} border-0 text-white`
        }
        if (buttonStyle === "outline") {
            return `${base} bg-transparent text-white border-2`
        }
        // glass (default)
        return `${base} backdrop-blur-md text-white border`
    }

    const getLinkStyle = (highlight: boolean): React.CSSProperties => {
        if (buttonStyle === "solid") {
            return highlight
                ? { backgroundColor: primary }
                : { backgroundColor: "rgba(255,255,255,0.12)" }
        }
        if (buttonStyle === "outline") {
            return highlight
                ? { borderColor: primary }
                : { borderColor: "rgba(255,255,255,0.2)" }
        }
        // glass
        return highlight
            ? {
                borderColor: `${primary}80`,
                backgroundColor: `${primary}1a`,
                boxShadow: `0 0 20px ${primary}26`,
            }
            : { borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.03)" }
    }

    const getIconStyle = (highlight: boolean): React.CSSProperties => {
        return highlight
            ? { borderColor: `${primary}4d`, backgroundColor: `${primary}33`, color: primary }
            : {}
    }

    const hasSocialLinks = Object.values(data.social_links).some(Boolean)

    return (
        <div
            className="relative min-h-dvh w-full overflow-hidden font-sans selection:bg-white/20 selection:text-white"
            style={{ backgroundColor: cfg.bg }}
        >
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div
                    className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full blur-[120px]"
                    style={{ backgroundColor: cfg.orb1Color }}
                />
                <div
                    className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full blur-[120px]"
                    style={{ backgroundColor: cfg.orb2Color }}
                />
                {cfg.noise && (
                    <div className="absolute inset-0 opacity-20 brightness-100 contrast-150"
                        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
                    />
                )}
            </div>

            <main className="relative z-10 mx-auto flex max-w-md flex-col items-center px-6 pb-20 pt-16">
                {/* Profile Header */}
                <div className="group relative mb-6">
                    <div
                        className="absolute -inset-1 rounded-full opacity-75 blur transition duration-1000 group-hover:opacity-100"
                        style={{ background: `linear-gradient(to right, ${primary}, #3b82f6)` }}
                    />
                    <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-white/20 bg-neutral-900 shadow-2xl">
                        {data.avatar_url ? (
                            <img
                                src={data.avatar_url}
                                alt={data.display_name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-950 text-3xl font-black text-white/20">
                                {data.display_name?.[0]?.toUpperCase() || "?"}
                            </div>
                        )}
                    </div>
                </div>

                <h1 className="mb-1 text-2xl font-black tracking-tighter text-white uppercase text-center">
                    {data.display_name}
                </h1>

                {data.tagline && (
                    <p className="mb-3 text-xs font-bold tracking-widest uppercase text-center" style={{ color: primary }}>
                        {data.tagline}
                    </p>
                )}

                <p className="mb-10 max-w-[280px] text-center text-sm font-medium leading-relaxed text-white/50">
                    {data.bio}
                </p>

                {/* Links */}
                <div className="flex w-full flex-col gap-4">
                    {data.links.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={getLinkClasses(!!link.highlight)}
                            style={getLinkStyle(!!link.highlight)}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${link.highlight ? "" : "border-white/10 bg-white/5 text-white/40"}`}
                                    style={link.highlight ? getIconStyle(true) : {}}
                                >
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

                {/* Social Icons */}
                {hasSocialLinks && (
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
                        {data.social_links.instagram && (
                            <a href={data.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-white/30 transition-colors hover:text-white">
                                <Instagram className="h-6 w-6" />
                            </a>
                        )}
                        {data.social_links.tiktok && (
                            <a href={data.social_links.tiktok} target="_blank" rel="noopener noreferrer" className="text-white/30 transition-colors hover:text-white">
                                <TikTokIcon className="h-5 w-5" />
                            </a>
                        )}
                        {data.social_links.youtube && (
                            <a href={data.social_links.youtube} target="_blank" rel="noopener noreferrer" className="text-white/30 transition-colors hover:text-white">
                                <Youtube className="h-6 w-6" />
                            </a>
                        )}
                        {data.social_links.whatsapp && (
                            <a href={data.social_links.whatsapp} target="_blank" rel="noopener noreferrer" className="text-white/30 transition-colors hover:text-white">
                                <MessageCircle className="h-6 w-6" />
                            </a>
                        )}
                        {data.social_links.facebook && (
                            <a href={data.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-white/30 transition-colors hover:text-white">
                                <Facebook className="h-6 w-6" />
                            </a>
                        )}
                        {data.social_links.linkedin && (
                            <a href={data.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/30 transition-colors hover:text-white">
                                <Linkedin className="h-6 w-6" />
                            </a>
                        )}
                        {data.social_links.twitter && (
                            <a href={data.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-white/30 transition-colors hover:text-white">
                                <Twitter className="h-6 w-6" />
                            </a>
                        )}
                        {data.social_links.telegram && (
                            <a href={data.social_links.telegram} target="_blank" rel="noopener noreferrer" className="text-white/30 transition-colors hover:text-white">
                                <Phone className="h-6 w-6" />
                            </a>
                        )}
                    </div>
                )}

                {/* Brand footer */}
                <div className="mt-16 flex flex-col items-center gap-1">
                    <div className="h-px w-12 bg-white/10 mb-6" />
                    <div className="flex items-center gap-2 opacity-40">
                        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: primary }} />
                        <span className="text-[10px] font-black tracking-widest text-white uppercase">Magic Funnel</span>
                    </div>
                </div>
            </main>

            <LegalFooter />
        </div>
    )
}
