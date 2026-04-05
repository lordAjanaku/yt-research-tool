import { useStore } from "../store/useStore";
import {
  buildSystemPrompt,
  buildUserMessage,
  buildLabelSystemPrompt,
  buildLabelUserMessage,
} from "../utils/aiPrompt";
import { ENDPOINTS } from "../utils/aiConfig";

export function useAIAnalysis() {
  const { aiProvider, aiApiKey } = useStore();

  async function callAI(systemPrompt, userMessage, maxTokens = 1000) {
    if (!aiApiKey) throw new Error("API Key not set");
    let raw = "";

    if (aiProvider === "anthropic") {
      const r = await fetch(ENDPOINTS.anthropic, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": aiApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: maxTokens,
          temperature: 0,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      raw = d.content?.[0]?.text || "";
    } else if (aiProvider.startsWith("gemini")) {
      const url = `${ENDPOINTS[aiProvider]}?key=${aiApiKey}`;
      
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Instructions: ${systemPrompt}\n\nTask: ${userMessage}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      });
      const d = await r.json();
      if (d.error) {
        if (d.error.code === 429)
          throw new Error(
            "Rate limit reached (Gemini Free Tier). Please wait a moment.",
          );
        throw new Error(d.error.message);
      }
      raw = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const r = await fetch(ENDPOINTS[aiProvider], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiApiKey}`,
        },
        body: JSON.stringify({
          model:
            aiProvider === "groq"
              ? "llama-3.3-70b-versatile"
              : aiProvider === "deepseek"
              ? "deepseek-chat"
              : "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: maxTokens,
          temperature: 0,
        }),
      });
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
      raw = d.choices?.[0]?.message?.content || "";
    }

    // Ultra-resilient JSON cleaning
    let clean = raw.replace(/```json|```/g, "").trim();

    // Remove common browser/console injection artifacts
    clean = clean.replace(/<anonymous code>.*$/s, "").trim();

    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.error("Raw AI Response:", raw);
      throw new Error("AI returned an invalid format (no JSON found).");
    }

    const jsonStr = clean.substring(start, end + 1);

    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      // Simple recovery for missing closing brace
      if (jsonStr.split("{").length > jsonStr.split("}").length) {
        return JSON.parse(jsonStr + "}");
      }
      throw e;
    }
  }

  async function analyze(entries) {
    return callAI(buildSystemPrompt(), buildUserMessage(entries), 2048);
  }

  async function labelVideo(video) {
    return callAI(buildLabelSystemPrompt(), buildLabelUserMessage(video), 2048);
  }

  async function testKey() {
    return analyze([
      {
        title: "Test",
        titleType: "Tension",
        emotion: "Fear",
        hook: "Bold Claim",
        pacing: "Fast",
        arc: "",
        insight: "",
        chMult: 5,
        views: 100000,
      },
    ]);
  }

  return { analyze, labelVideo, testKey };
}
