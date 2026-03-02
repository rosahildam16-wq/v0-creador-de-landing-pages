let _resend: any = null;

export async function getResend() {
    if (_resend) return _resend;

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn("Resend API Key is missing. Email will not be sent.");
        return {
            emails: {
                send: async () => ({ data: null, error: new Error("Missing Key") })
            }
        };
    }

    const { Resend } = await import('resend');
    _resend = new Resend(apiKey);
    return _resend;
}
