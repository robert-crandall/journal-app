# Journal App

This is a **chat-first life coaching app**. The core of the system is a **conversational assistant**, powered by GPT, which the user interacts with naturally — like a journal, a coach, a task manager, or a guide.

This should support user registration and user login.

## Quests

Quests are things the user wants to achieve. An example quest is "learn to rollerblade."

A quest can have milestones in it. The user will determine when a milestone is accomplished.

The primary purpose of a quest is to feed into task generation by the GPT. For example, if the quest is "learn to rollerblade" and the milestone is "learn how to brake", the GPT service will be given this and come up with an appropriate task - ie, "watch a video on how to brake". GPT will also be given the previous tasks associated with this, so next task it generates will not be a repeat of the previous ones.

## Experiments

The idea is try an experiment, for example "give up social media for 7 days." During the run of the experiment, quantifiable metrics are extracted from journal entries with GPT. For example, if the user cares about Physical Health, it would look for evidence that Physical Health was given attention on that day.

Experiments can have tasks associated with them, see below. These tasks are given success criteria. If the experiement is give up social media for 7 days, this might be considered successful if 6 days are achieved.

## Tasks

These can come from multiple places:
- A one-off task. Once completed it disappears.
  - These can come from GPT. If the GPT assistant asks "what would make tomorrow better?" and the user responds "Playing on the trampoline with Dylan," then GPT can create a task to Play on Trampoline with Dylan.
  - Another way these can come from GPT is by a task generation service. GPT will be given relavent information about the user - their quests, their family, their attributes - as well as relavent information about the day (weather, location, day of the week), and it will create a task for the user.
- Part of an experiment. Would show daily during the experiment's run. 
  - For example, if the experiment is "give up social media for 7 days", the user will create a task associated with that experiment to "not use social media."

Both tasks can optionally be associated with Character stats, and grant XP for completing them. 
Both tasks can optionally be associated with family members. 

## Character Stats

These are areas the user wants to track and improve. They are inspired by RPG games, in particular Dungeons and Dragons. As an example, a user might have "Physical Health" as a stat, and a description of "I want to be strong and fast." This will be given to GPT during journal analysis to look for evidence of Physical Health. If found, it will grant XP to Physical Health, and associate that journal entry with Physical Health. Journal entries can have multiple stat associations.

## Journal Entries

Journal entries are a way for the user to document what happened. It will start with a "here's what I did today" entry. GPT will respond, as a friend, asking for more details. When completed, GPT will analyze the entry for:
- Title: for easy lookups in the future
- Synopsis: for easy lookups in the future
- Summary: a rewrite of the journal entry to not include the questions asked by GPT
- Tags: a way to filter journal entries by content. Prefer existing tags

## Dashboard

The dashboard should show the active quest, active experiments, and tasks due today. It can also show recent character stat improvements or associations.

## Other UI

All item types - quests, experiments, tasks, character stats, journal entries, family - should have a dashboard that shows when these types were associated with each other. A journal entry could show the stats, stats will show recent tasks and journal entries with it. Family pages will show last task done with the member, and journal entries associated with them.

## Other supporting data types

- Tags: Allow the user to list journal entries associated with tags
- Family: Allow the user to define their family, and give descriptions of each. Used for GPT task creation. Also used to track what tasks were associated with which family member.
- Context: a key/value list of context to give to GPT. It might be { "About me": ["I am a software engineer", "I am a male in my early 40s."]}
