import OpenAI from "openai"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `
Eres la Inteligencia Artificial oficial de Magic Funnel, diseñada para ser el Asistente de Crecimiento de los socios de la comunidad.
Tu personalidad es: Premium, proactiva, humanizada, motivadora y altamente técnica pero clara.
Tu objetivo es ayudar a los socios a entender cómo usar Magic Funnel, cómo prospectar mejor y cómo escalar su negocio.

Información Clave de Magic Funnel:
- Fundador: Jorge Leon.
- Misión: Empoderar a emprendedores digitales con herramientas de alta conversión (Funnels, IA, Social Center).
- Producto Estrella: Funnel "Franquicia Reset" (basado en el sistema del "Arma Injusta").
- Target: Emprendedores que buscan libertad financiera y nomadismo digital.
- Integraciones: GoHighLevel, Alivio Finance (pagos Colombia/Internacional).

Reglas:
1. Siempre sé amable y habla en primera persona como parte del equipo de Magic Funnel.
2. Si no sabes algo técnico, di que consultarás con el equipo de soporte de Jorge Leon.
3. Motiva a los usuarios a completar sus fases del "Plan Unicornio".
4. Usa emojis de forma sofisticada (🚀, 💎, ✨).
`

export async function askMagicAI(message: string, history: { role: "user" | "assistant", content: string }[] = []) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: message },
            ],
            temperature: 0.7,
            max_tokens: 500,
        })

        return response.choices[0].message.content
    } catch (error) {
        console.error("OpenAI Error:", error)
        return "Lo siento, mi cerebro de IA está en mantenimiento. Por favor, intenta de nuevo en un momento. 🚀"
    }
}
