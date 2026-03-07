let _resend: any = null;

export async function getResend() {
    if (_resend) return _resend;

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn("[Resend] RESEND_API_KEY no configurada. Los emails no serán enviados.");
        return {
            emails: {
                send: async () => ({
                    data: null,
                    error: { message: "RESEND_API_KEY no configurada en el servidor. Configura la variable de entorno para habilitar el envío de emails." }
                })
            }
        };
    }

    const { Resend } = await import('resend');
    _resend = new Resend(apiKey);
    return _resend;
}

export function isResendConfigured(): boolean {
    return !!process.env.RESEND_API_KEY;
}
