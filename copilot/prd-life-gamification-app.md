# Product Requirements Document: Life Gamification App

## Introduction/Overview

The Life Gamification App transforms daily life into a Dungeons & Dragons-style adventure game, with GPT acting as the Dungeon Master (DM). The app helps users become better versions of themselves by gamifying personal growth, outdoor activities, and family time through a character progression system with experience points (XP), quests, and journaling.

The primary goal is to encourage the user to become an outdoor adventurer who spends quality time with family by making these activities engaging through game mechanics and AI-powered task generation.

## Goals

1. **Encourage Outdoor Adventure**: Generate and track tasks that promote outdoor activities and exploration
2. **Strengthen Family Connections**: Create family-focused tasks and track interactions with family members
3. **Personal Growth Tracking**: Provide a character progression system that reflects real-life skill development
4. **Intelligent Task Generation**: Use GPT to create personalized, contextual daily tasks based on user goals, weather, and history
5. **Meaningful Reflection**: Enable rich journaling with AI assistance to extract insights and grant XP
6. **Habit Formation**: Gamify daily activities to build positive habits through consistent engagement

## User Stories

- **As a user**, I want to check in each morning and answer "What would make today successful?" so that I can receive personalized tasks for the day
- **As a user**, I want to complete tasks throughout the day and immediately see XP rewards so that I feel accomplished and motivated
- **As a user**, I want to journal about my day with AI assistance so that I can reflect meaningfully and earn XP for personal growth
- **As a user**, I want to track my character stats and level up manually so that I can celebrate my progress
- **As a user**, I want the app to remember my family members' preferences so that suggested activities are more likely to be enjoyed
- **As a user**, I want to create quests and experiments so that I can work toward longer-term goals
- **As a user**, I want weather-aware task suggestions so that outdoor activities are appropriate for the conditions
- **As a user**, I want to manage projects and ad-hoc tasks so that I can stay organized while pursuing my main goals

## Functional Requirements

### 1. User Authentication & Profile
1.1. User must be able to create an account with secure login to keep journal private
1.2. User profile must include character class (e.g., "Ranger") and freeform backstory description
1.3. System must provide sample character classes for user selection
1.4. User must be able to set personal goals in freeform text

### 2. Character Stats & Progression
2.1. User must be able to define custom character stats (e.g., "Strength", "Fatherhood")
2.2. Each stat must track total XP and current level
2.3. Level progression must follow formula: Level N requires ((N(N+1))/2)*100 total XP.
2.4. User must manually trigger level-ups to maintain sense of accomplishment
2.5. GPT must generate humorous level titles for each stat level (e.g., "Weak Worm" → "Barbarian")
2.6. Stats must include example activities and sample XP values for GPT context

### 3. Daily Focus & Morning Check-in
3.1. User must be able to define daily focuses (e.g., "Call for Adventure", "Preparation Day")
3.2. System must provide sample focuses with titles and descriptions
3.3. Morning check-in must ask "What would make today successful?" and similar questions
3.4. GPT must generate personalized daily tasks based on check-in responses

### 4. Task Management System
4.1. **DM-Generated Tasks**: GPT must create two daily tasks (personal growth + family connection) based on:
   - User's character description and class
   - Current goals and daily focus
   - Family member information and interaction history
   - Weather data (when available)
   - Previous task feedback
   - Current projects
4.2. **Quest Tasks**: Long-term goals with associated tasks (e.g., "Complete 7 hikes in 30 days")
4.3. **Experiment Tasks**: Short-term behavioral experiments (e.g., "No social media for 7 days")
4.4. **Project Tasks**: Non-XP tasks for larger efforts (e.g., "Build a shed")
4.5. **Ad-hoc Tasks**: Daily activities tied to specific stats (e.g., "Workout" → Strength XP)
4.6. **Simple Todos**: One-off reminders without XP or tracking
4.7. Task completion must immediately display XP rewards with visual feedback

### 5. Family Member Management
5.1. User must be able to add family members with names and detailed profiles
5.2. Each family member must have likes, dislikes, and activity preferences
5.3. System must track task history with each family member
5.4. System must record family member feedback on completed tasks
5.5. GPT must use family data to ensure appropriate task frequency and variety

### 6. XP & Rewards System
6.1. GPT must dynamically assign XP based on task difficulty and impact
6.2. User must be able to override XP values for specific tasks
6.3. System must support negative XP for certain behaviors
6.4. XP must be immediately awarded upon task completion
6.5. Journal entries must generate XP based on character stat involvement

### 7. Conversational Journal
7.1. User must be able to initiate journal entries from homepage
7.2. GPT must ask follow-up questions to help user describe their day
7.3. System must extract from completed journal conversations:
   - Summary (rewritten in user's tone)
   - Synopsis (1-2 sentence condensed version)
   - Title (6-10 words describing events)
   - Content tags (3-6 mood/event tags, preferring existing tags)
   - Character stat tags (matching user's defined stats only)
7.4. Character stat tags must automatically grant XP to relevant stats

### 8. Quest & Experiment Tracking
8.1. User must be able to create quests with associated tasks and deadlines
8.2. User must be able to create experiments with specific durations
8.3. Quest/experiment pages must display:
   - Associated journal entries during timeframe
   - XP gained per stat during period
   - Completed tasks with timestamps
   - Success metrics and progress

### 9. Weather Integration
9.1. System must optionally integrate with weather APIs using zip code
9.2. Weather data must influence GPT task generation (indoor alternatives for bad weather)

### 10. Data Management
10.1. All data relationships must support loose coupling (deleting quests preserves associated task history)
10.2. System must maintain data integrity while allowing flexible record management

## Non-Goals (Out of Scope)

- Guided onboarding process
- Data export functionality (PostgreSQL backups sufficient)
- Social features or sharing capabilities
- Third-party API integrations (Todoist, etc.) for MVP
- Mobile-specific native apps
- Offline functionality
- User-provided OpenAI API keys (environment variable sufficient)
- Complex analytics or reporting beyond quest/experiment dashboards

## Design Considerations

### User Interface
- **Homepage/Dashboard**: Central hub optimized for INTJ + ADHD users
  - Clear, actionable task list for today
  - Immediate XP feedback on task completion
  - Quick journal entry access
  - Completed tasks section for sense of accomplishment
- **Progressive Web App**: Responsive design supporting both mobile and desktop browsers
- **Desktop Experience**: Full-width layouts that utilize desktop screen real estate effectively
- **Visual Feedback**: Immediate XP animations and stat updates on task completion

### User Experience
- **Morning Ritual**: Streamlined check-in process with contextual questions
- **Immediate Gratification**: Instant XP rewards and visual feedback
- **Contextual Intelligence**: Weather-aware and family-preference-aware task suggestions
- **Reflection Support**: AI-guided journaling to encourage meaningful self-reflection

### UX Design

- Use card-based layouts (GitHub style) for tasks and quests
- Green accent colors for completed tasks and XP gains
- Warm, adventurous color palette (forest greens, sunset oranges, mountain blues)
- Generous whitespace to reduce ADHD overwhelm
- Immediate visual feedback for task completion. Think Duolingo's celebration animations

## Technical Considerations

- **Backend**: Hono framework with PostgreSQL database and Drizzle ORM
- **Frontend**: SvelteKit PWA with responsive design
- **AI Integration**: OpenAI GPT API via environment variable configuration
- **Weather Data**: Optional weather API integration with configurable location
- **Authentication**: Secure user login system for journal privacy
- **Data Storage**: UUID primary keys, timestamptz for all datetime fields
- **Type Safety**: End-to-end TypeScript with Hono stacks

## Success Metrics

- **Engagement**: Daily active usage with consistent morning check-ins and evening journaling
- **Goal Achievement**: Completion rates for DM-generated family and personal tasks
- **Character Progression**: Regular stat leveling indicating sustained growth
- **Family Connection**: Tracked family activities meeting frequency targets
- **Outdoor Activity**: Increased completion of outdoor/adventure tasks
- **User Satisfaction**: Positive feedback on task suggestions and journal insights
- **Habit Formation**: Sustained engagement over 30+ day periods
