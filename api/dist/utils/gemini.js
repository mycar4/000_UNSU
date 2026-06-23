import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
/**
 * Gemini 1.5 Flash API를 직접 호출하여 텍스트를 생성합니다.
 */
export async function callGemini(prompt, systemInstruction) {
    if (!GEMINI_API_KEY) {
        console.warn('[Gemini] GEMINI_API_KEY is missing. Falling back to default mock text.');
        throw new Error('Gemini API key is not configured.');
    }
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        const requestBody = {
            contents: [
                {
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 600
            }
        };
        if (systemInstruction) {
            requestBody.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        const data = await res.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) {
            throw new Error('Invalid or empty response structure from Gemini API');
        }
        return generatedText.trim();
    }
    catch (err) {
        console.error('[Gemini] API execution failed:', err.message);
        throw err;
    }
}
