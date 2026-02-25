import { Resend } from 'resend';

// Initialize with a fallback or lazy getter to prevent build errors if the key is missing
const apiKey = process.env.RESEND_API_KEY;

// Export an object that mimics the Resend instance but checks for the key
export const resend = apiKey
    ? new Resend(apiKey)
    : {
        emails: {
            send: async () => {
                console.error("Resend API Key is missing. Email cannot be sent.");
                return { data: null, error: new Error("Missing Resend API Key") };
            }
        }
    } as unknown as Resend;
