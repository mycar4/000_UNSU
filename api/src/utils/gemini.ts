import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { recordTokenUsage, recordTokenUsageLog } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

function getLocalFallbackResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('사주') || p.includes('운세') || p.includes('일진')) {
    return `기사님! 오늘의 사주 일진을 보니 오전에 서쪽 방향으로 이동하시면 재물운(財物運)이 상승하는 기운이 있습니다. 급하게 운행하시기보다 여유를 가지고 안전운전 하시면 좋은 승객을 만나실 상입니다. 오늘도 안전하고 대박 나는 하루 보내세요!`;
  }
  if (p.includes('날씨')) {
    return `현재 기사님이 계신 지역의 기운을 살펴보니 촉촉한 물의 기운(水氣)이 흐르고 있네요. 가끔 구름이 끼거나 습도가 높을 수 있으니 차량 내 에어컨 온도를 적절히 맞추시고 쾌적하게 운행하시길 조언해 드립니다.`;
  }
  if (p.includes('코스') || p.includes('핫존') || p.includes('추천') || p.includes('어디')) {
    return `오늘 추천해 드리는 코스는 유동인구가 집중되는 지하철역 인근 및 대형 환승 센터 주변입니다. 실시간 기운이 강남, 마포, 영등포 일대에 뭉쳐 있으니 해당 지역을 중심으로 부드럽게 순회해 보시는 것을 적극 권장합니다.`;
  }
  return `아이고 기사님, 대통이가 언제나 기사님의 길잡이가 되어 드리겠습니다! 사주, 오늘 일진, 실시간 핫존 코스나 날씨 등에 대해 물어보시면 명리학적 기운과 함께 시원하게 풀어드릴 테니 무엇이든 편하게 여쭤보세요.`;
}

/**
 * Gemini 1.5 Flash API를 직접 호출하여 텍스트를 생성합니다.
 */
export async function callGemini(prompt: string, systemInstruction?: string, driverId: string = 'system'): Promise<string> {
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini] GEMINI_API_KEY is missing. Falling back to default mock text.');
    return getLocalFallbackResponse(prompt);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody: any = {
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
      requestBody.system_instruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data: any = await res.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('Invalid or empty response structure from Gemini API');
    }

    if (data.usageMetadata) {
      const promptTokens = data.usageMetadata.promptTokenCount || 0
      const outputTokens = data.usageMetadata.candidatesTokenCount || 0
      const totalTokens = data.usageMetadata.totalTokenCount || 0
      
      // Update daily aggregate
      recordTokenUsage(promptTokens, outputTokens, totalTokens)
      
      // Log individual event with driverId
      recordTokenUsageLog(driverId, promptTokens, outputTokens, totalTokens)
      
      console.log(`[Gemini Token Usage] Prompt: ${promptTokens} | Output: ${outputTokens} | Total: ${totalTokens}`)
    }

    return generatedText.trim();
  } catch (err: any) {
    console.error('[Gemini] API execution failed:', err.message);
    throw err; // Let server.ts handle the fallback to OpenAI
  }
}
