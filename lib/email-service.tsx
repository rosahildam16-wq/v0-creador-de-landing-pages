import { getResend } from "./resend"
import { WelcomeEmail } from "@/components/emails/welcome-email"
import { SkaliaWelcomeEmail } from "@/components/emails/skalia-welcome"

export async function sendWelcomeEmail({
    email,
    name,
    communityCode,
    communityId,
}: {
    email: string
    name: string
    communityCode: string
    communityId?: string
}) {
    try {
        const resend = await getResend();
        const isSkalia =
            communityCode?.toUpperCase() === "DIAMANTECELION" ||
            communityId === "skalia-vip"
        const EmailComponent = isSkalia ? SkaliaWelcomeEmail : WelcomeEmail

        const { data, error } = await resend.emails.send({
            from: "Magic Funnel <notificaciones@magicfunnel.app>",
            to: [email],
            subject: isSkalia
                ? "¡Bienvenido a la Élite! Skalia + Magic Funnel 🚀"
                : "¡Bienvenido a Magic Funnel! 🚀",
            react: <EmailComponent
                name={name}
                communityCode={communityCode}
                dashboardUrl={`${process.env.NEXT_PUBLIC_BASE_URL || "https://magicfunnel.app"}/login`}
            />,
        })

        if (error) {
            console.error("Error sending welcome email:", error)
            return { success: false, error: (error as any)?.message || String(error) }
        }

        return { success: true, data }
    } catch (err) {
        console.error("Exception sending welcome email:", err)
        return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
}

export async function sendSkaliaWelcome(email: string, name: string) {
    return sendWelcomeEmail({
        email,
        name,
        communityCode: "DIAMANTECELION"
    })
}

export async function sendCampaignEmail({
    email,
    name,
    subject,
    contentHtml,
}: {
    email: string
    name: string
    subject: string
    contentHtml: string
}) {
    try {
        const resend = await getResend();

        // Personalize content
        let html = contentHtml
            .replace(/{nombre}/g, name || "Amigo")
            .replace(/{email}/g, email)

        const { data, error } = await resend.emails.send({
            from: "Magic Funnel <notificaciones@magicfunnel.app>",
            to: [email],
            subject: subject,
            html: html,
        })

        if (error) {
            console.error("Error sending campaign email:", error)
            return { success: false, error: (error as any)?.message || String(error) }
        }

        return { success: true, data }
    } catch (err) {
        console.error("Exception sending campaign email:", err)
        return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
}
