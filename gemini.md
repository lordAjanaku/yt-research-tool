# gemini.md

## Project: YouTube Outlier Research Tool

AI-powered research system for discovering YouTube outliers, validating
topics, extracting patterns, and generating content strategies.

------------------------------------------------------------------------

# 1. Project Goal

Build a client-side research tool that helps creators:

1.  Find outlier videos\
2.  Validate topics\
3.  Analyze patterns using AI\
4.  Extract winning content formulas\
5.  Generate production checklist

Methodologies:

-   SIAM Outlier Method
-   Topic Validation SOP
-   Pattern Extraction Workflow

------------------------------------------------------------------------

# 2. Outlier Definition

outlier_multiple = video_views / channel_median_views

Qualified if:

outlier_multiple \>= threshold

Threshold:

-   3x (lenient)
-   4x (standard)
-   5x (strict)

------------------------------------------------------------------------

# 3. App Layout

Three panel architecture

Top Bar\
Nav Panel \| Left Context Panel \| Right Data Panel\
Status Bar

------------------------------------------------------------------------

# 4. Pages

## Outlier Research

Collect and store outlier videos

Inputs: - single video - multiple URLs - keyword search - CSV upload -
JSON upload

Output table: - title - channel - subs - views - median - multiple -
qualifies - title type - emotion - hook - pacing

------------------------------------------------------------------------

## Channel Analysis

Find outliers inside a channel

Inputs: - channel url - time range - baseline size - threshold

Output: channel video table

------------------------------------------------------------------------

## Topic Validation

5 Phase SOP

V1 Demand\
V2 Competition\
V3 Momentum\
V4 Gaps\
V5 Decision

Output: GO / ADJUST / PIVOT

------------------------------------------------------------------------

## Pattern Analysis

Input: CSV / JSON

AI returns:

-   dominant patterns
-   narrative arc
-   title formulas
-   checklist

------------------------------------------------------------------------

# 5. AI JSON Contract

{ "dominant_title_type": "","dominant_hook": "","dominant_emotion":
"","dominant_pacing": "","narrative_arc": \[\], "pattern_statement":
"","title_formulas": \[\], "production_checklist": \[\] }

------------------------------------------------------------------------

# 6. Enum Values

title type:

-   Tension
-   Mechanism
-   Contrarian
-   Stakes
-   Historical Revelation
-   Curiosity Gap

hook:

-   Bold Claim
-   Shocking Fact
-   Open Loop
-   Question
-   Contradiction

emotion:

-   Fear
-   Curiosity
-   Outrage
-   Awe
-   Urgency
-   Validation

pacing:

-   Slow
-   Medium
-   Fast

------------------------------------------------------------------------

# 7. Tech Stack

React + Vite\
Tailwind\
shadcn/ui\
Zustand\
Recharts\
Lucide

APIs:

-   YouTube Data API
-   Gemini
-   OpenAI
-   Claude
-   OpenRouter
-   Groq

------------------------------------------------------------------------

# 8. Folder Structure

src/ components/ sections/ store/ hooks/ utils/

------------------------------------------------------------------------

# 9. State

settings\
outliers\
channelResults\
validation\
patterns\
filters\
theme\
apiKeys

------------------------------------------------------------------------

# 10. Qualification Logic

multiple = views / median

qualifies = multiple \>= threshold

------------------------------------------------------------------------

# 11. Theme

Dark Amber (default)\
Dark Blue\
Dark Green\
Dark Purple\
Light

------------------------------------------------------------------------

# 12. Gemini Rules

Gemini must:

1.  Return JSON only\
2.  Respect enums\
3.  Never change schema\
4.  Limit arrays 3-7\
5.  Analyze qualified outliers first

------------------------------------------------------------------------

# End
