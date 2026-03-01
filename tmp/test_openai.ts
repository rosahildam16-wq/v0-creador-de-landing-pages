import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

// Load .env.local from the project root
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function testOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("Testing API Key:", apiKey ? apiKey.substring(0, 7) + "..." : "MISSING");

    if (!apiKey) {
        console.error("ERROR: OPENAI_API_KEY is not set in .env.local");
        return;
    }

    const openai = new OpenAI({ apiKey });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 5,
        });
        console.log("SUCCESS! Response:", response.choices[0].message.content);
    } catch (error) {
        console.error("FAILED! Error details:");
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        if (error.response) {
            console.error("Full Response:", JSON.stringify(error.response, null, 2));
        }
    }
}

testOpenAI();
