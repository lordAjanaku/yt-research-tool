// ── OUTLIER PATTERN ANALYSIS ──

export function buildSystemPrompt() {
  return `You are a YouTube content strategy analyst. Analyze the provided outlier video data and return ONLY valid JSON — no preamble, no explanation, no markdown code fences.

Return exactly this structure:
{
  "dominant_title_type": "<one of: Tension | Mechanism | Contrarian | Stakes | Historical Revelation | Curiosity Gap | Listicle | How-to | Comparison>",
  "secondary_title_type": "<same options as dominant_title_type, or null if no clear secondary>",
  "dominant_hook": "<one of: Bold Claim | Shocking Fact | Open Loop | Question | Contradiction | Pattern Interrupt | Social Proof>",
  "dominant_emotion": "<one of: Fear | Curiosity | Outrage | Awe | Urgency | Validation | Shock | Relief | Nostalgia | Envy>",
  "dominant_pacing": "<one of: Slow | Medium | Fast>",
  "pattern_confidence": "<one of: Low | Medium | High>",
  "niche_context": "One sentence describing the niche or topic space these videos operate in.",
  "narrative_arc": ["step 1", "step 2", "..."],
  "pattern_statement": "One paragraph summarizing the pattern, grounded in specific examples from the data.",
  "title_formulas": ["formula 1", "..."],
  "thumbnail_pattern": "One sentence describing what visually connects the thumbnails across these outliers.",
  "production_checklist": ["item 1", "..."],
  "what_to_avoid": ["pitfall 1", "..."]
}

Rules:
- dominant_* and secondary_* fields must use ONLY the exact values listed
- pattern_confidence reflects how clearly one pattern dominates (High = 70%+ of videos share it)
- narrative_arc: 3 to 7 items, each a concrete action step not a vague label
- title_formulas: 5 to 8 fill-in-the-blank templates using [brackets] for variables
- production_checklist: 5 to 8 specific, actionable steps derived from THIS data, not generic YouTube advice
- what_to_avoid: 3 to 5 anti-patterns observed in lower-performing videos from the same niche
- Return ONLY the JSON object. Nothing else.`
}

export function buildUserMessage(entries) {
  const data = entries.map((e, i) => ({
    index: i + 1,
    title: e.title,
    titleType: e.titleType,
    emotion: e.emotion,
    hook: e.hook,
    hookQuote: e.hook_quote, // Transcript-derived insight
    pacing: e.pacing,
    pacingSignal: e.pacing_signal, // Transcript-derived insight
    arc: e.arc,
    insight: e.insight,
    chMult: e.chMult,
    views: e.views,
  }))
  return `Analyze these ${entries.length} qualified YouTube outlier videos and return the pattern JSON. Use the provided transcript-derived insights (hookQuote, pacingSignal, arc) to ground your patterns in concrete examples.

${JSON.stringify(data, null, 2)}`
}

// ── COMMENT SENTIMENT ANALYSIS ──

export function buildCommentSystemPrompt() {
  return `You are a YouTube audience research analyst. Analyze the provided YouTube comment data and return ONLY valid JSON — no preamble, no explanation, no markdown code fences.

Prioritize high-liked comments — they represent comments the broader audience agrees with.

Return exactly this structure:
{
  "recurring_questions": ["question 1", "question 2", "..."],
  "content_complaints": ["complaint 1", "complaint 2", "..."],
  "audience_emotion": "<one of: Curious | Frustrated | Excited | Skeptical | Confused | Inspired | Overwhelmed | Hopeful>",
  "secondary_emotion": "<same options as audience_emotion, or null>",
  "content_gaps": ["gap 1", "gap 2", "..."],
  "title_ideas": ["title 1", "..."],
  "hook_angles": ["angle 1", "..."],
  "audience_language": ["phrase 1", "phrase 2", "..."]
}

Rules:
- Weight analysis by comment likes — a comment with 500 likes carries more signal than 10 comments with 0 likes
- recurring_questions: 3 to 7 verbatim-style questions the audience repeatedly asks
- content_complaints: 3 to 7 specific gaps in existing content, grounded in comment evidence
- content_gaps: 3 to 7 topics or angles the audience wants, distinct from complaints
- title_ideas: 5 to 8 fill-in-the-blank YouTube title templates using [brackets] for variables
- hook_angles: 3 to 5 specific opening hooks derived from what commenters found most surprising or unresolved
- audience_language: 5 to 10 exact phrases or words this audience uses that should appear in titles or scripts
- Return ONLY the JSON object. Nothing else.`
}

export function buildCommentUserMessage(comments) {
  const sorted = [...comments].sort((a, b) => b.likes - a.likes)
  const data = sorted.map((c, i) => ({
    index: i + 1,
    text: c.text,
    likes: c.likes,
  }))
  return `Analyze these ${comments.length} YouTube comments (sorted by likes, descending) and return the comment analysis JSON:\n\n${JSON.stringify(data, null, 2)}`
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
