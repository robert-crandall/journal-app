# Product Requirements Document: Gamified Life RPG

## 1. Introduction/Overview

This document outlines the requirements for a new application that turns personal development into a gamified, Dungeons & Dragons-style experience. The goal is to create an engaging and motivating app that helps the user grow into a better version of themselves, specifically focusing on becoming a better "outdoor adventurer who spends time with his family."

The core of the app is an AI Dungeon Master (DM) that assigns personalized daily tasks, grants experience points (XP) for completed activities, and helps the user reflect on their journey through a conversational journal.

## 2. Goals

- **Gamify Personal Growth:** Create a fun, engaging system where the user can track progress, level up stats, and complete quests related to their real-life goals.
- **Provide Actionable Guidance:** Use an AI assistant to generate relevant, personalized, and actionable daily tasks that align with the user's character, goals, and daily focus.
- **Encourage Family Connection:** Intelligently generate tasks that promote quality time with family members.
- **Facilitate Self-Reflection:** Implement a conversational journal that helps the user process their day and extracts meaningful insights, summaries, and tags from their entries.
- **Deliver a Focused UI:** Design a dashboard experience tailored to INTJ + ADHD personas, emphasizing clarity, immediate feedback, and a sense of accomplishment.

## 3. User Stories

- **As a user, I want to...** create a character with a class and backstory, so that the experience feels personalized and immersive.
- **As a user, I want to...** define my personal stats (like "Strength" and "Fatherhood"), so that I can track my growth in areas that matter to me.
- **As a user, I want to...** receive two personalized tasks each day from an AI Dungeon Master, so that I have clear, guided objectives for my personal growth and family time.
- **As a user, I want to...** complete long-term Quests and short-term Experiments, so that I can structure my efforts towards larger goals and test new habits.
- **As a user, I want to...** use a conversational journal to reflect on my day, so that I can gain deeper insights and earn XP for my experiences.
- **As a user, I want to...** see the XP I earn immediately after completing a task, so that I feel a sense of reward and motivation.
- **As a user, I want to...** view my progress on a dashboard, so that I can easily see what I need to do and what I've accomplished.

## 4. Functional Requirements

The development will be phased to build foundational features first.

### Phase 1: Core User & Character Foundation

1.  **User Authentication:** Users must be able to register, log in, and log out.
2.  **Character Creation:**
    - A user can create one character.
    - The user can select a `Class` from a predefined list (e.g., Ranger, Warrior, Mage). The system should also allow the user to define a custom class.
    - The user can write a freeform text `Backstory` for their character.
3.  **Stats System:**
    - The system will provide a list of predefined `Stats` (e.g., Strength, Wisdom, Fatherhood).
    - The user can define their own custom `Stats`.
    - Each stat will have an associated XP total and a level.
4.  **Goals and Family:**
    - The user can define their high-level personal `Goals` in a freeform text field.
    - The user can add `Family Members` with names and descriptions (e.g., likes, dislikes) to be used as context for the AI.

### Phase 2: Core Task, Journaling, and XP Loop

1.  **Simple Todos:** Users can create, view, and complete simple, one-off todo items.
2.  **XP and Leveling:**
    - Marking a task as complete grants the user XP, which is added to the total for one or more relevant stats.
    - The amount of XP required to advance to the next level is calculated as `(Current Level * 100)`.
    - When a stat has accumulated enough XP, the user can manually trigger a "Level Up." There is no immediate in-game benefit to leveling up, other than a new title.
3.  **Basic Journaling:**
    - A user can launch a conversational journal experience.
    - The system will present a list of predefined questions to start the conversation (e.g., "How was your day?").
    - The conversation/entry is saved.

### Phase 3: AI Dungeon Master Integration

1.  **AI-Powered Level Titles:** The system will use GPT to generate humorous and creative titles for each stat level (e.g., Strength Level 1: "Weak Worm", Strength Level 20: "Barbarian Overlord").
2.  **AI Daily Task Generation:**
    - The system will generate two unique tasks for the user each day: one focused on personal goals and one focused on family connection.
    - The generation will use the following context: character class/backstory, goals, daily focus, family members, projects, adventures, and real-time weather data.
3.  **AI Journal Analysis:**
    - After a user finishes a journal entry, the system will use GPT to process the conversation and extract:
      - **Summary:** A stitched-together narrative of the user's day.
      - **Synopsis:** A 1-2 sentence summary.
      - **Title:** A 6-10 word title for the entry.
      - **Content Tags:** 3-6 relevant tags (e.g., "happy," "work," "family").
      - **Character Stat Tags:** Tags corresponding to the user's stats that were reflected in the entry.
    - XP will be granted to the stats identified in the `Character Stat Tags`.

### Phase 4: Advanced Goal Structures & Integrations

1.  **Quests:**
    - Users can create long-term `Quests` (e.g., "Spend more time outside").
    - Quests can have multiple, smaller tasks associated with them.
    - Quest context is provided to the AI for task generation.
2.  **Experiments:**
    - Users can create short-term `Experiments` (e.g., "Go without social media for 7 days").
    - Experiments have associated tasks but do _not_ influence AI task generation.
    - Upon completion, the user can add a `Conclusion` to the experiment (e.g., "This was successful, I want to do it again").
    - Experiments can be associated with a Quest.
3.  **Projects:** Users can define `Projects` with tasks. These do not grant XP but are used as context for the AI DM.
4.  **Adventures:** Users can define `Adventures` with tasks. These do not grant XP but are used as context for the AI DM.
5.  **Ad-Hoc Tasks:** Users can create repeatable, ad-hoc tasks tied to a specific stat (e.g., "Workout" -> "Strength") to log daily activities.
6.  **Weather API:** The system must integrate with a real weather API to fetch the projected weather for the user's location.

### Phase 5: Dashboards & UI/UX

1.  **Main Dashboard:**
    - The primary screen will display all of today's actionable tasks (DM-assigned, Quest, Experiment, and simple todos).
    - When a task is marked complete, a temporary animation will display the XP gained.
    - The dashboard will show a running total of XP gained for the day.
    - A "Quick Journal Entry" button will launch the full conversational journal experience.
2.  **Quest & Experiment Dashboards:**
    - Each Quest and Experiment will have a dedicated dashboard page.
    - These pages will show progress, associated tasks, relevant journal entries made during its timeframe, and total XP gained.
    - The Quest dashboard will also display any associated Experiments and their conclusions.

## 5. Non-Goals (Out of Scope)

- Integration with third-party task apps (e.g., Todoist).
- A task feedback mechanism (completing the task is sufficient).
- Negative XP or penalties.
- Automated level-ups (the user must manually trigger them).
- Monetization features.
- Social or multi-user features.

## 6. Design Considerations

- The UI/UX should be optimized for an **INTJ + ADHD** user profile: high information density, clear hierarchies, minimal distraction, and immediate, satisfying feedback.
- The gamification elements (XP animations, level-up titles) should be prominent to drive motivation.

## 7. Technical Considerations

- **Database:** Data relationships should be loose to prevent cascading deletes. For journal, deleting a Quest should not delete the tasks that were completed as part of it. `user_id` should be a foreign key for all user-generated data.
- **API:** A real weather API must be integrated for task generation.
- **Type Safety:** The frontend must import all data types directly from the backend to ensure end-to-end type safety.

## 8. Open Questions

- Should there be a limit on the number of active Quests or Experiments a user can have?
- How should the system handle the initial creation of "sample" classes, stats, and focuses for a new user? Should they be pre-populated or suggested during onboarding?
- What is the trigger to end the conversational journal and begin GPT processing? (e.g., a user command like "/done", a button).
