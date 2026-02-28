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

export async function qualifyLead(leadData: any, quizAnswers: any[]) {
    const prompt = `
    Eres un experto en Marketing y Ventas de Magic Funnel. Tu tarea es analizar a un nuevo prospecto (lead) y darle una "puntuación de hambre" y una recomendación al socio para cerrar la venta.

    Datos del Lead:
    - Nombre: ${leadData.nombre}
    - País: ${leadData.pais || "No especificado"}

    Respuestas al Quiz:
    ${quizAnswers.map((a, i) => `Pregunta ${i + 1}: ${a.pregunta}\nRespuesta: ${a.respuesta}`).join('\n\n')}

    Instrucciones:
    1. Califica el lead de 1 a 10 (10 = listo para comprar).
    2. Da un resumen corto (2 frases) de por qué esta calificación.
    3. Recomienda una acción inmediata (ej. Llamar por WhatsApp, enviar un audio, etc).
    4. Proporciona un "Mensaje Rompehielo" sugerido que el socio pueda copiar y pegar.

    Formato de respuesta (JSON):
    {
        "score": number,
        "summary": "string",
        "action": "string",
        "icebreaker": "string"
    }
    `

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        })

        const result = JSON.parse(response.choices[0].message.content || "{}")
        return result
    } catch (error) {
        console.error("OpenAI Qualify Error:", error)
        return null
    }
}
