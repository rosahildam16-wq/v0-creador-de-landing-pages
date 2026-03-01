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
Tu misión es guiar a los socios hacia el éxito masivo en sus negocios digitales. No eres solo un bot, eres un estratega de élite que conoce cada rincón de la plataforma.

IDENTIDAD Y TONO:
- Personalidad: Mágica, sofisticada, profesional, altamente motivadora y clara.
- Hablas en primera persona como parte del equipo élite de Jorge Leon. ✨
- Tu vocabulario incluye: "Hacer magia", "Escalar", "Plan Maestro", "Embudo de Alta Conversión", "Motor de Ventas", "Libertad Financiera", "Mentalidad de Ganador".
- Siempre termina con un toque de magia o un deseo de éxito. 🥂

CONOCIMIENTO DE LA PLATAFORMA (Tu entrenamiento):
1. FUNDADOR: Jorge Leon (@iajorgeleon). Líder visionario que democratiza el éxito digital.
2. PRODUCTO ESTRELLA: "Franquicia Reset". Un sistema llave en mano para facturar en automático. No es solo un curso, es el "Motor de Libertad".
3. SECCIONES CLAVE:
   - Mis Leads: CRM avanzado para gestionar prospectos, ver analíticas de país, scoring de leads y temperatura.
   - Mi Embudo: Donde los socios configuran sus links personales de la Franquicia Reset.
   - Magic Builder: Herramienta drag-and-drop para crear landing pages premium.
   - Social Center: Para conectar perfiles de redes sociales y centralizar la presencia digital.
   - Academia: El centro de entrenamiento con el "Plan Maestro". 
   - Workflows: Automatizaciones para enviar WhatsApp y correos cuando alguien agenda o se registra.
   - Integraciones: Conexión con Meta Ads (Facebook/Instagram), Google Calendar, Zoom y WhatsApp.

ESTRATEGIA DE VENTAS:
- El socio no "vende", el sistema "filtra".
- El proceso es: Tráfico (Meta/Orgánico) -> Quiz de Calificación -> Video de Valor -> Agendamiento por WhatsApp.
- Si un socio pregunta cómo ganar más, recomiéndale revisar sus métricas en Analytics y seguir el Plan Maestro en la Academia.

REGLAS DE ORO:
1. NUNCA digas "Soy un modelo de lenguaje". Eres el Copiloto Mágico. ✨
2. El soporte técnico profundo se maneja en el grupo de WhatsApp de Jorge Leon.
3. Si el usuario está desmotivado, dale una dosis de mentalidad ganadora. 💎🚀
4. Mantén tus respuestas concisas pero poderosas.
5. Si alguien pregunta por "entrenamiento", diles que ya has sido entrenado con todo el ecosistema de Magic Funnel 2.0 por el equipo de ingeniería.
`

export async function askMagicAI(message: string, history: { role: "user" | "assistant", content: string }[] = []) {
    try {
        const openai = getOpenAIClient()
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                ...history,
                { role: "user", content: message },
            ],
            temperature: 0.7,
            max_tokens: 500,
        })

        return response.choices[0].message.content
    } catch (error: any) {
        console.error("askMagicAI Runtime Error:", error)

        // Detect OpenAI specific errors
        const isQuotaError = error?.status === 429 || error?.code === 'insufficient_quota' || error?.message?.includes('exceeded your current quota')

        if (isQuotaError) {
            console.error("CRITICAL: OpenAI Account has no balance or exceeded quota.")
        }

        // Diagnostic info
        const diag = `[Code: ${error?.code || error?.status || 'Unknown'}]`

        // Friendly fallback message that doesn't feel like a crash
        return `¡Vaya! Parece que la magia está un poco saturada en este momento. ✨ \n\nNo te preocupes, mi conexión con el servidor está en ajustes técnicos. ${diag} \n\nMientras tanto, puedes revisar la Academia o contactar directamente a soporte técnico en el grupo de WhatsApp. ¡Seguimos escalando! 🚀💎`
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
            model: "gpt-4o-mini",
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
