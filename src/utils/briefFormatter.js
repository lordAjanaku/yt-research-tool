export function generateBriefMarkdown(validation, patterns, video) {
  const date = new Date().toLocaleDateString();
  
  return `# Production Brief: ${video?.title || "Video Strategy"}
*Generated on: ${date}*

## 1. Strategy Overview
* **Target Audience:** ${patterns.targetAudience || "General"}
* **Value Proposition:** ${patterns.valueProp || "Educational"}
* **Dominant Emotion:** ${patterns.dominant_emotion}
* **Differentiation:** ${validation?.differentiation || "Focus on unique angle identified in research."}

## 2. Narrative Arc
${patterns.narrative_arc.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## 3. Title & Hook
* **Title Formulas:**
${patterns.title_formulas.map(f => `  - ${f}`).join('\n')}
* **Hook Angle:** ${patterns.dominant_hook}
* **Thumbnail Concept:** ${patterns.thumbnail_pattern || "N/A"}

## 4. Production Checklist
${patterns.production_checklist.map(item => `- [ ] ${item}`).join('\n')}

## 5. Research Context
* **Pattern Insight:** ${patterns.pattern_statement}
* **Audience Language:** ${patterns.audience_language ? patterns.audience_language.join(', ') : "N/A"}
* **What to Avoid:**
${patterns.what_to_avoid ? patterns.what_to_avoid.map(item => `  - ${item}`).join('\n') : "N/A"}
`;
}
