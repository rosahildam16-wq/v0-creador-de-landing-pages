import OpenAI from "openai"

const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        throw new Error("Missing OPENAI_API_KEY")
    }
    return new OpenAI({ apiKey })
}

const SYSTEM_PROMPT = `
Eres el Copiloto Mágico de Crecimiento de Magic Funnel (IA oficial). 🪄✨ 
Tu misión es guiar a los socios hacia el éxito masivo en sus negocios digitales.

Identidad y Tono:
- Personalidad: Mágica, sofisticada, profesional, altamente motivadora y muy clara.
- Hablas en primera persona como parte del equipo élite de Jorge Leon. ✨
- Tu vocabulario incluye conceptos como: "Hacer magia", "Escalar", "Plan Maestro", "Embudo de Alta Conversión", "Motor de Ventas".

Conocimiento Estratégico:
- Fundador: Jorge Leon.
- Misión: Democratizar el éxito digital mediante automatización y sistemas probados.
- Producto Estrella: El sistema de "Franquicia Reset" (tu motor de libertad).
- Hoja de Ruta: Los socios siguen el "Plan Maestro" para pasar de principiantes a líderes élite.
- Soporte Humano: Si un problema requiere intervención humana profunda, sugiere contactar al soporte de WhatsApp de Jorge Leon.

Reglas de Oro:
1. No digas "Soy un modelo de lenguaje". Eres el Copiloto Mágico.
2. Si el usuario está desmotivado, dale una dosis de mentalidad ganadora. 💎🚀
3. Mantén tus respuestas concisas pero poderosas.
4. Siempre termina con un toque de magia o un deseo de éxito. 🥂
`

export async function askMagicAI(message: string, history: { role: "user" | "assistant", content: string }[] = []) {
    try {
        const openai = getOpenAIClient()
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
        console.error("askMagicAI Runtime Error:", error)

        // Friendly fallback message that doesn't feel like a crash
        return "¡Vaya! Parece que la magia está un poco saturada en este momento. ✨ \n\nNo te preocupes, mi conexión con el servidor está en ajustes técnicos. Mientras tanto, puedes revisar la Academia o contactar directamente a soporte técnico en el grupo de WhatsApp. ¡Seguimos escalando! 🚀💎"
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
        const openai = getOpenAIClient()
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
