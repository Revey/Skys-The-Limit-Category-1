import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client lazily (to avoid errors if API key not set)
let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set')
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

// Model selection - default to gemini-2.5-flash for best balance
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview-05-20'

export async function generateCoachReport(prompt: string): Promise<string> {
  const useMock = process.env.COACH_MOCK === 'true'

  if (useMock) {
    return getMockResponse()
  }

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[LLM] GEMINI_API_KEY not set, falling back to mock response')
    return getMockResponse()
  }

  try {
    const model = getGenAI().getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,  // Increased significantly for full coaching reports
      },
    })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    if (!text) {
      console.error('[LLM] Empty response from Gemini')
      return getMockResponse()
    }

    return text
  } catch (error) {
    console.error('[LLM] Gemini API error:', error)
    // Fallback to mock on error
    return getMockResponse()
  }
}

// Streaming version for real-time responses (future enhancement)
export async function generateCoachReportStream(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  if (!process.env.GEMINI_API_KEY || process.env.COACH_MOCK === 'true') {
    const mock = getMockResponse()
    onChunk(mock)
    return mock
  }

  try {
    const model = getGenAI().getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    })

    const result = await model.generateContentStream(prompt)

    let fullText = ''
    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      fullText += chunkText
      onChunk(chunkText)
    }

    return fullText
  } catch (error) {
    console.error('[LLM] Gemini streaming error:', error)
    const mock = getMockResponse()
    onChunk(mock)
    return mock
  }
}

function getMockResponse(): string {
  return `## EVIDENCE

• **Rotation timing data** — Defense rotations averaged 4+ seconds after initial contact calls, resulting in 1v2 or 1v3 retake situations in 6 of 13 defensive rounds.

• **Attack-side execute patterns** — The default A-site execute was used in 8 of 12 attack rounds. Opponents began pre-positioning utility by round 15, countering 5 consecutive entries.

• **Trade efficiency metrics** — Entry fragger eliminations were traded within 2 seconds only 40% of the time. Teammates were positioned 15+ meters back during entries, leading to repeated 4v5 situations.

• **Player performance breakdown** — Top performer had 18K/12D (1.50 KD) but 7 deaths in isolated positions. Support players showed inconsistent utility timing on executes.

## INSIGHT

• **Defensive communication breakdown** — Late rotations indicate information is not being shared quickly enough when opponents fake site takes. The team is over-committing to initial contact before confirming enemy positions.

• **Predictability on attack** — Over-reliance on the default A execute has made the team readable. Opponents have identified the timing windows and pre-positioned utility accordingly.

• **Spacing issues impacting trades** — Entry fraggers are dying in positions where teammates cannot follow up. This suggests a coordination gap between the entry player and the second-in.

## RECOMMENDATION

1. **Implement 2-second rotation protocol** — When initial contact is called, one player should rotate immediately while others hold for confirmation. Run retake drills (3v3, 4v4) focusing on staggered utility and trading.

2. **Develop 2-3 execute variations per site** — Create alternative timings and entry points. Assign one player to track which executes have been used and call for variation.

3. **Close entry spacing to 8-10 meters** — Second player should be positioned to trade within 1.5 seconds. Practice entry sequences in custom games with explicit trade responsibilities.

4. **VOD review: 5 closest round losses** — Identify decision points where different rotations or execute calls could have changed outcomes. Focus on communication timestamps.`
}
