// ── OUTLIER PATTERN ANALYSIS ──

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

// ── COMMENT SENTIMENT ANALYSIS ──

export function buildCommentSystemPrompt() {
  return `You are a YouTube audience research analyst. Analyze the provided YouTube comment data and return ONLY valid JSON — no preamble, no explanation, no markdown code fences.

Return exactly this structure:
{
  "recurring_questions": ["question 1", "question 2", "..."],
  "content_complaints": ["complaint 1", "complaint 2", "..."],
  "audience_emotion": "<one of: Curious | Frustrated | Excited | Skeptical | Confused | Inspired>",
  "content_gaps": ["gap 1", "gap 2", "..."],
  "title_ideas": ["title 1", "title 2", "..."]
}

Rules:
- recurring_questions: 3 to 7 questions the audience repeatedly asks, in their own words
- content_complaints: 3 to 7 specific things the audience says existing videos fail to explain or cover
- audience_emotion: the single dominant emotional tone across all comments, must use ONLY the exact values listed
- content_gaps: 3 to 7 specific topics or angles the audience wants but no existing video provides
- title_ideas: 3 to 7 video title ideas derived directly from what the audience is asking — written as clickable YouTube titles
- Return ONLY the JSON object. Nothing else.`
}

export function buildCommentUserMessage(comments) {
  const data = comments.map((c, i) => ({
    index: i + 1,
    text: c.text,
    likes: c.likes,
  }))
  return `Analyze these ${comments.length} YouTube comments and return the comment analysis JSON:\n\n${JSON.stringify(data, null, 2)}`
}

// ── INDIVIDUAL OUTLIER LABELING ──

export function buildLabelSystemPrompt() {
  return `You are a YouTube metadata analyst. You will receive a video title, metadata, and optionally a transcript.

Source rules — follow strictly:
- hook_quote and pacing_signal MUST be derived from the transcript if one is provided
- If no transcript is provided, set hook, hook_quote, pacing, and pacing_signal to null
- titleType and emotion are derived from the title
- arc and insight are derived from the transcript if available, otherwise inferred from the title

Return exactly this structure:
{
  "titleType": "<one of: Tension | Mechanism | Contrarian | Stakes | Historical Revelation | Curiosity Gap | Listicle | How-to | Comparison>",
  "emotion": "<one of: Fear | Curiosity | Outrage | Awe | Urgency | Validation | Shock | Relief | Nostalgia | Envy>",
  "hook": "<one of: Bold Claim | Shocking Fact | Open Loop | Question | Contradiction | Pattern Interrupt | Social Proof> or null",
  "hook_quote": "The exact first 1-2 sentences from the transcript that establish the hook, or null if no transcript.",
  "pacing": "<one of: Slow | Medium | Fast> or null",
  "pacing_signal": "One sentence citing specific transcript evidence for this pacing — e.g. sentence length, re-hook frequency, info density. null if no transcript.",
  "targetAudience": "<one of: Beginners | Experts | Skeptics | Dreamers | Aspirants | General>",
  "valueProp": "<one of: Educational | Entertaining | Inspirational | Transformation | Validation | Escapism>",
  "thumbnailConcept": "5 to 10 words describing a specific visual thumbnail concept.",
  "arc": ["setup", "conflict or tension", "resolution or payoff"],
  "insight": "One sentence: the specific mechanism that drove this video's outlier performance.",
  "replication_risk": "<one of: Low | Medium | High>"
}

Rules:
- All enum fields MUST use ONLY the exact values listed above
- hook and pacing must be null when no transcript is present — never guess from the title
- hook_quote must be copied verbatim from the transcript, not paraphrased
- pacing_signal must cite specific evidence, not restate the pacing label
- arc must be an array of exactly 3 items
- insight must be specific to this video, not generic YouTube advice
- replication_risk: High = formula is overused in the niche; Low = fresh angle with room to copy
- Return ONLY the JSON object. Nothing else.`
}

export function buildLabelUserMessage(video) {
  const nicheNote = video.niche ? `\nNiche: ${video.niche}` : ''
  const transcriptBlock = video.transcript
    ? `\n\n--- TRANSCRIPT ---\n${video.transcript}`
    : '\n\n[No transcript provided — set hook, hook_quote, pacing, and pacing_signal to null]'

  return `Analyze this YouTube video and return the metadata JSON:

Title: "${video.title}"
Channel: "${video.channel}"
Views: ${video.views}
Outlier Multiple: ${video.chMult}x${nicheNote}${transcriptBlock}`
}
