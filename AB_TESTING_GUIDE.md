# 🧪 A/B Testing Feedback System - Implementation Guide

## Overview

The A/B Testing Feedback system (also called "Potions") allows users to conduct personal experiments and automatically gather evidence about their effectiveness through journal sentiment analysis and task completion feedback.

## Key Features

### 1. **Passive Data Collection**
- **Journal Sentiment Analysis**: GPT automatically extracts sentiment scores (1-5) and mood tags from journal entries
- **Task Mood Scoring**: Optional 1-5 energy/mood rating when completing tasks
- **Automatic Potion Linking**: Active potions are automatically linked to journal entries and task completions

### 2. **GPT Pattern Recognition**
- **Weekly Analysis**: Analyzes journal sentiment trends and task completion patterns
- **Effectiveness Rating**: Provides clear ratings (Likely Effective, Mixed Results, etc.)
- **Actionable Recommendations**: Suggests next steps based on data patterns

### 3. **User Experience**
- **Non-intrusive**: All feedback is optional except for basic task completion
- **Visual Results**: Clear effectiveness indicators on potion cards
- **Bulk Analysis**: "Analyze All" button for batch processing

## Database Schema Changes

### New Fields Added:

**journals table:**
- `sentiment_score` (integer 1-5): GPT-analyzed emotional sentiment
- `mood_tags` (jsonb array): GPT-extracted mood descriptors
- `potion_id` (uuid, nullable): Links to active potion during journal submission

**tasks table:**
- `mood_score` (integer 1-5, nullable): Optional user mood/energy rating
- `potion_id` (uuid, nullable): Links to active potion during task completion

## API Endpoints

### Journal Processing
- Existing journal submission automatically includes sentiment analysis
- No API changes required for basic usage

### Task Completion
- Existing `/api/tasks/:id/complete` endpoint now accepts optional `moodScore`
- Example: `{ "status": "complete", "moodScore": 4, "feedback": "Great workout!" }`

### Potion Analysis
- `POST /api/potions/:id/analyze` - Analyze specific potion effectiveness
- `GET /api/potions/:id/analysis` - Retrieve stored analysis
- `POST /api/potions/analyze-all` - Run batch analysis for all active potions

## Frontend Usage

### Task Completion Feedback
1. Complete a task from the dashboard
2. Optional mood/energy rating appears (1-5 scale)
3. Existing emotion tags and feedback text remain available
4. All fields are optional except basic completion status

### Potion Management
1. Navigate to `/potions` page
2. Create new experiments with title and hypothesis
3. Use dropdown menu on each potion:
   - "Analyze Effectiveness" - Run immediate analysis
   - "View Analysis" - See stored results
4. Use "Analyze All" button for batch processing

### Results Display
- Effectiveness indicators: 🧪✅ (Likely Effective), 🧪❓ (Mixed Results), etc.
- Summary text explaining findings
- Actionable recommendations for next steps

## Usage Workflow

### 1. Create a Potion
```
Title: "Morning Protein Shake"
Hypothesis: "Having a protein shake each morning will improve my energy levels"
Start Date: Today
End Date: 2 weeks from now
```

### 2. Use the App Normally
- Write journal entries (sentiment automatically analyzed)
- Complete tasks (optionally rate mood/energy)
- Data automatically links to active potions

### 3. Analyze Results
- Click "Analyze Effectiveness" after a few days of data
- Review findings on the potion card
- Follow recommendations for next steps

## Technical Implementation

### GPT Processing
- Journal submissions trigger enhanced GPT analysis
- New prompt extracts sentiment scores and mood tags
- Fallback to mock data when OpenAI API unavailable

### Pattern Recognition
- `potionAnalysis.ts` service analyzes linked data
- Compares journal sentiment patterns and task completion rates
- Generates effectiveness ratings and recommendations

### Data Linking
- Helper function `getActivePotions()` finds current experiments
- Automatic linking during journal/task submission
- No foreign key constraints (potions can be deleted safely)

## Mock Data for Testing

When OpenAI API is not configured:
- **Journal Analysis**: Sentiment score 3 (neutral), mood tag "reflective"
- **Potion Analysis**: "Mixed results" effectiveness with generic recommendations

## Benefits

1. **Effortless**: No extra work required beyond normal app usage
2. **Insightful**: GPT provides objective analysis of subjective experiences
3. **Actionable**: Clear recommendations for experiment continuation or modification
4. **Flexible**: All feedback is optional, system adapts to available data

## Future Enhancements

- Scheduled weekly analysis cron jobs
- Comparison between multiple active potions
- Integration with task generation (GPT suggests tasks aligned to active potions)
- Export analysis results for external tracking