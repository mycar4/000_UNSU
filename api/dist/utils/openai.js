import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
/**
 * OpenAI gpt-4o-mini API를 호출하여 대답을 생성합니다.
 */
export async function callOpenAI(prompt, systemInstruction) {
    if (!OPENAI_API_KEY) {
        console.warn('[OpenAI] OPENAI_API_KEY is missing. Throwing error for fallback.');
        throw new Error('OpenAI API key is not configured.');
    }
    try {
        const url = 'https://api.openai.com/v1/chat/completions';
        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: prompt });
        const requestBody = {
            model: 'gpt-4o-mini',
            messages: messages,
            temperature: 0.7,
            max_tokens: 600
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        const data = await res.json();
        const generatedText = data.choices?.[0]?.message?.content;
        if (!generatedText) {
            throw new Error('Invalid or empty response structure from OpenAI API');
        }
        return generatedText.trim();
    }
    catch (err) {
        console.error('[OpenAI] API execution failed:', err.message);
        throw err;
    }
}
