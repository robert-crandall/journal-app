# Product Requirements Document: D&D Life Gamification App

## Introduction/Overview

The D&D Life Gamification App transforms personal development into an engaging role-playing experience where users become the hero of their own life story. The app addresses the challenge of balancing outdoor adventure with family time by using GPT as a Dungeon Master (DM) to assign personalized tasks, track progress through character stats and XP, and facilitate reflective journaling.

**Problem Statement**: Users struggle to maintain consistency in personal growth activities, particularly balancing adventure/outdoor time with meaningful family connections.

**Solution**: A gamified system that uses AI to generate contextual tasks, provides immediate XP rewards for completion, and builds long-term character progression to encourage sustained engagement.

## Goals

1. **Increase Daily Engagement**: Users complete at least 1 AI-generated task per day
2. **Balance Life Areas**: Ensure equal focus on personal adventure and family connection tasks
3. **Build Reflection Habits**: Users engage with conversational journaling 4+ times per week
4. **Character Progression**: Users feel tangible progress through XP and level advancement
5. **Adaptive Learning**: AI learns from user feedback to improve task relevance over time

## User Stories

**As an outdoor adventure enthusiast**, I want AI-generated tasks that encourage exploration so that I can discover new activities and locations.

**As a user**, I want to check-in in the morning "What would make today successful" to influence GPT's generated tasks for the day.

**As a parent**, I want family-focused tasks that help me connect meaningfully with each family member so that I can strengthen our relationships.

**As someone with ADHD**, I want immediate XP feedback when I complete tasks so that I feel accomplished and motivated to continue.

**As a goal-oriented person**, I want to track my character's growth over time so that I can see tangible progress in different life areas.

**As a busy individual**, I want quick access to today's priorities so that I can focus on what matters most without decision fatigue.

**As a reflective person**, I want guided journaling that helps me process my experiences so that I can learn and grow from daily events.

## Functional Requirements

### Core Character System
1. Users must be able to create a character with a class (hybrid D&D/modern options provided) and custom backstory
2. Users must be able to define custom character stats grouped into categories: Physical, Mental, Social, Adventure, Family Time, Creativity, Health
3. System must provide sample stats for each category to guide users
4. Each stat must track total XP and current level independently
5. Level progression must follow formula: Level N requires (N × 100) total XP
6. Users must manually trigger level-ups to control pacing and celebrate achievements
7. GPT must generate humorous, contextual level titles for each stat progression
8. Each stat must include example activities and XP values to guide AI task generation

### AI Task Generation (Daily)
9. System must generate exactly 2 tasks daily: 1 personal adventure task + 1 family connection task
10. AI must consider: user class/backstory, goals, daily focus, family members, task history, feedback, weather, projects, family interaction timing
11. Generated tasks must specify target character stat(s) and estimated XP reward
12. Weather data must be automatically detected via zip code with manual override option
13. Task generation must respect family interaction rules (e.g., "play with youngest son every third day")

### Task Management System
14. Dashboard must display all active tasks from multiple sources: AI-generated, quests, experiments, simple todos
15. Quest tasks must show progress toward completion goals and deadline status
16. Experiment tasks must be clearly differentiated from quests (shorter-term, no AI influence)
17. Project tasks must not appear on dashboard but influence AI generation context
18. Ad-hoc tasks must be accessible via separate page and tied to specific character stats
19. Simple todos must appear on dashboard but not integrate with XP/quest systems
20. System must support external task sources via API integration (data structure prepared)

### Task Completion & Feedback
21. Completing AI-generated tasks must trigger brief feedback form
22. Completing non-AI tasks must show quick XP notification (2-second display)
23. Dashboard stat displays must update immediately to reflect XP gains
24. Users must be able to mark tasks complete with single click/tap
25. Completed tasks must remain visible on dashboard to show daily accomplishments
26. System must track task completion patterns for AI learning

### Family Member Management
27. Users must be able to add family members with names, ages, and interests
28. System must track recent interactions with each family member
29. Family member data must inform AI task generation for connection activities
30. Users must be able to set interaction frequency preferences per family member

### Conversational Journal System
31. Homepage must provide quick journal entry access
32. GPT must ask smart follow-up questions based on detected mood/content
33. Users must be able to end journal conversations at any time
34. System must extract from completed conversations: summary, synopsis, title, content tags, character stat tags
35. Content tags must prefer existing tags but allow creation of new ones
36. Character stat tags must strictly use existing user stats only
37. Journal entries must be able to award XP to relevant character stats
38. System must support negative XP for character stats when appropriate

### Daily Focus System
39. Users must be able to set daily focuses with titles and descriptions
40. System must provide sample focuses for different days/situations
41. Daily focus must influence AI task generation priorities
42. Focus examples: "Call for Adventure" (Saturday), "Week Preparation" (Monday)

### Goal & Project Management
43. Users must be able to set freeform personal goals that influence AI generation
44. Users must be able to create projects with multiple associated tasks
45. Project progress must inform AI suggestions but not appear on main dashboard
46. Goals must be editable and trackable over time

### Quest & Experiment Dashboards
47. Each quest/experiment must have dedicated dashboard showing: timeline, XP gained per stat, completed tasks, associated journal entries
48. Dashboards must help users evaluate experiment effectiveness
49. Quest completion must award bonus XP for meeting deadlines/targets
50. System must differentiate quest vs experiment behavior (AI consideration, duration)

### Data Architecture
51. All relationships must support loose coupling (delete quest ≠ delete associated completed tasks)
52. User deletion must cascade to all user-related data
53. System must maintain task completion history independent of source task existence
54. Database must support efficient lookups for AI context gathering

### User Experience (INTJ + ADHD Optimized)
55. Homepage dashboard must prioritize: today's tasks, XP progress, quick journal access
56. Interface must minimize decision fatigue with clear daily priorities
57. Immediate feedback must be provided for all user actions
58. Navigation must be simple and consistent across all screens
59. Loading states must be minimal and informative

## Non-Goals (Out of Scope)

- Multi-user collaboration or social features
- Integration with fitness trackers or external health apps (beyond weather)
- Automated task completion detection
- Complex quest creation tools (keep quests simple)
- Gamification beyond XP/levels (no badges, achievements, etc.)
- Offline functionality
- Advanced AI customization (users cannot modify AI behavior directly)
- Task scheduling/calendar integration
- Push notifications (in initial version)

## Design Considerations

- **Mobile-first responsive design** optimized for iOS Safari and desktop
- **Lucide icons** throughout the interface (no emojis)
- **Immediate visual feedback** for all interactions (especially XP gains)
- **Card-based layout** for tasks with clear completion states
- **Progressive disclosure** to avoid overwhelming ADHD users
- **Consistent color coding** for different task types and stat categories

## Technical Considerations

- **Monorepo structure** with Hono backend and SvelteKit frontend
- **PostgreSQL database** with Drizzle ORM
- **OpenAI GPT integration** for task generation and journal processing
- **Weather API integration**
- **Type-safe API** communication using Hono stacks
- **UUID primary keys** throughout database schema
- **Timezone-aware** timestamp handling (UTC backend, local frontend)
- **Extensible task source** architecture for future API integrations
