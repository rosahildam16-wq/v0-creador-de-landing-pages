import { getResend } from "./resend"
import { WelcomeEmail } from "@/components/emails/welcome-email"

export async function sendWelcomeEmail({
    email,
    name,
    communityCode,
}: {
    email: string
    name: string
    communityCode: string
}) {
    try {
        const resend = getResend();
        const { data, error } = await resend.emails.send({
            from: "Magic Funnel <onboarding@resend.dev>", // Cambiar por dominio propio luego
            to: [email],
            subject: "¡Bienvenido a Magic Funnel! 🚀",
            react: WelcomeEmail({
                name,
                communityCode,
                dashboardUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/login`
            }),
        })

        if (error) {
            console.error("Error sending welcome email:", error)
            return { success: false, error }
        }

        return { success: true, data }
    } catch (err) {
        console.error("Exception sending welcome email:", err)
        return { success: false, error: err }
    }
}
