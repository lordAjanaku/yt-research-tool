export function buildSystemPrompt() {
  return `You are a YouTube content strategy analyst. Analyze the provided outlier video data and return ONLY valid JSON — no preamble, no explanation, no markdown code fences.

Return exactly this structure:
{
  "dominant_title_type": "<one of: Tension | Mechanism | Contrarian | Stakes | Historical Revelation | Curiosity Gap>",
  "dominant_hook": "<one of: Bold Claim | Shocking Fact | Open Loop | Question | Contradiction>",
  "dominant_emotion": "<one of: Fear | Curiosity | Outrage | Awe | Urgency | Validation>",
  "dominant_pacing": "<one of: Slow | Medium | Fast>",
  "narrative_arc": ["step 1", "step 2", "..."],
  "pattern_statement": "one paragraph summarizing the pattern",
  "title_formulas": ["formula 1", "..."],
  "production_checklist": ["item 1", "..."]
}

Rules:
- dominant_* fields must use ONLY the exact values listed above
- narrative_arc: 3 to 7 items
- title_formulas: 3 to 7 fill-in-the-blank templates using [brackets] for variables
- production_checklist: 3 to 7 actionable steps
- Return ONLY the JSON object. Nothing else.`
}

export function buildUserMessage(entries) {
  const data = entries.map((e, i) => ({
    index: i + 1,
    title: e.title,
    titleType: e.titleType,
    emotion: e.emotion,
    hook: e.hook,
    pacing: e.pacing,
    arc: e.arc,
    insight: e.insight,
    chMult: e.chMult,
    views: e.views,
  }))
  return `Analyze these ${entries.length} qualified YouTube outlier videos and return the pattern JSON:\n\n${JSON.stringify(data, null, 2)}`
}
