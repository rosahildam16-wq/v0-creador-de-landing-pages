const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

function loadEnv() {
    try {
        const envPath = path.join(process.cwd(), ".env.local");
        const content = fs.readFileSync(envPath, "utf8");
        const lines = content.split("\n");
        for (const line of lines) {
            if (line.includes("=")) {
                const [key, ...valueParts] = line.split("=");
                process.env[key.trim()] = valueParts.join("=").trim();
            }
        }
    } catch (e) {
        console.error("Error reading .env.local:", e.message);
    }
}

async function testOpenAI() {
    loadEnv();
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("Testing API Key:", apiKey ? apiKey.substring(0, 10) + "..." : "MISSING");

    if (!apiKey) {
        console.error("ERROR: OPENAI_API_KEY is not set");
        return;
    }

    const openai = new OpenAI({ apiKey });

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Say hello briefly" }],
            max_tokens: 10,
        });
        console.log("SUCCESS! Result:", response.choices[0].message.content);
    } catch (error) {
        console.error("FAILED! Error details:");
        console.error("Status:", error.status);
        console.error("Code:", error.code);
        console.error("Message:", error.message);
        if (error.response) {
            console.log("Response Body:", error.response.body);
        }
    }
}

testOpenAI();
