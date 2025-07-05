Goal: Create an app that helps me be a better version of myself. I want to be an outdoor adventurer who spends time with his family, and I'm having a hard time doing that.

Trying to build an app to encourage and grow that side of me. The app does this in two ways:

The overview of this app is it will turn life into a Dungeons and Dragons game, with GPT as the Dungeon Master (DM). The DM will take what the character knows about themselves, and the goals and experiments the character has, and assign things to do. The dungeon master will grant experience points (XP) based on completed tasks, as well as what the user writes in their journal.

Ways a user can have tasks assigned:
- Dungeon master assigns tasks. This takes the user's description and desired class, the user's goals, the user's desired focus for the day, the user's families, previous tasks (along with task source), previous task feedback, the projected weather for the day, user's projects, and the last time the user completed a task with their family. It will then generate two tasks designed to enrich the user. First task is for the user, primarily focused on goals and focuses. The second task is something to do with the user's family, a connection task.
- Quests can have tasks associated with them. For journal, a quest could be "Spend more time outside" and tasks would be "Complete 7 hikes in the next 30 days." The homepage would show these tasks and the current status. The user would get XP for completing each of the 7 hikes, and would get bonus XP if they hit their target of 7 hikes within 30 days. These are shown on the user's homepage/dashboard.
- Experiments are almost identical to quests. The have tasks as well, and those tasks are shown on the same page as quest tasks (on the user's dashboard). They are shorter lived. They do not influence the dungeon master when creating tasks. An journal experiment is "Go without social media for 7 days" and the task is to avoid social media.
- Projects are another source of tasks. A project can have multiple tasks on it. Like, "Cleaning the garage" can have steps "donate clothes stored in garage" and "recycle all cardboard". The user adds these subtasks to the project. These subtasks are not shown on the dashboard, and do not grant XP. They are given to GPT for generation. "Today is a call for adventure, but it is raining. You can make progress on cleaning your garage by donating clothes."
- Adventures are another source of tasks. These are very similar to projects. They can have multiple subtasks that are user created. These substats are not shown on the dashboard and do not grant XP. They are given to GPT for generation.
- Ad-hoc tasks. These are ways to track daily activities and grant extra XP to a character stat. An journal ad-hoc task is "workout." This is tied to the character stat "Strength", and completing it would grant XP to strength. They are not shown on the user's dashboard, they are in a separate page.
- Simple todo item, one-off tasks. This is something the user needs to remember. They are shown on the homepage. They are not tracked with quests, experiments. They are not included in the GPT context. These are simply things a user needs to do, and would be good to show on the homepage.
- Sync with an API. For journal, Todoist. This is not needed for the MVP.

Deconstructing the above:
- User has a class and description. For journal, the user's class is "Ranger", and the backstory is freeform text. This is given to GPT for context. Sample classes should be provided. 
- User has character stats. For journal, "Strength". These gain XP. 
- Stats also have levels on them. For journal, "Strength Level 3". Level ups are done manually,  in order to allow the user a sense of accomplishment or collect a reward when they level up. XP is stored at a total for each stat. If a user has enough XP to level up Strength, but hasn't done it yet, they continue collecting XP. The amount of XP for each level is (Level Number * 100). So to go from Level 1 to Level 2, 200 additional XP is required, meaning it would be 100 (Level 1) + 200 (Level 2) = 300 total XP.
- Stats also have journal activities that feed into GPT, with journal XP for the sample activity. This helps GPT assign tasks and XP for a given stat.
- GPT should be used to generate humorous level titles. "Strength Level 1" might be a weak worm, Level 20 might be a barbarian.
- User has a freeform goal. This is also given to GPT for context.
- User has focuses for the day. For journal, Saturdays are a Call for Adventure day, and Monday as a day to prepare for the rest of the week. Focuses should have titles and descriptions. Sample focuses and descriptions should be provided.
- The user has family members. The primary purpose is to give the family members to GPT, along with the family member's descriptions (user will provide likes and dislikes), and track what tasks were done with members. The reason to do this is to ensure family member tasks can follow some rules. For journal, "make sure I play with my youngest son every third day."
- Previous tasks and feedback is a way to learn what the user, and user's family, likes. For journal, a previous task could be "Play soccer with youngest son" and feedback could be "He did not like this." This should be given to GPT for context.
- Projects. These are ways for the user to keep focused on accomplishing larger efforts. A project could be "build a shed". GPT will be given the project and next task due for the project.

A big part of Dungeons and Dragons is storytelling. This will be done via a conversational journal. The journal will use GPT to help the user describe their day, by asking follow up questions about the journal's entry. When the user is done, GPT will extract several pieces of information from the conversation:
- A summary: This will rewrite the conversation based on the user's tone, to stitch together the user's responses into a single entry. 
- A synopsis: A 1-2 sentence condensed version of what happened
- A title: 6-10 words describing the day's events
- Content tags: 3-6 tags based on the events and user's mood. These will prefer existing content tags, but can create new ones if needed. Journals: "sleep", "relationship", "happy"
- Character stat tags: These will determine if any of the user's personal character stats were present. For journal, a user might have a stat of "strength" with a description "The ability to lift heavy things", and this would be present in an entry talking about workouts. Strictly choose from existing tags. These will be tied to character stats. XP can be granted for these. (Is there a way to grant negative XP? A stat of "fatherhood" would lose XP if the user said "I hyperfocused on a video game and ignored my kids")

Data relationships
- All data should support loose lookups. The user should have the ability to delete a quest without deleting the tasks done during the quest's framework. User_ID can be a foreign key though. If a user is deleted, all their tasks can be deleted.

Screens
- The homepage should be a dashboard showing what the user should do today. This should be designed for INTJ + ADHD. Clicking a task as done shows immediate XP points granted. It should also show the done tasks, so the user knows how much they've accomplished.
- User should also see a quick journal entry option on the homepage.
- Quests and experiments should have dashboards that show journal entries, XP gained per stat, completed tasks done during the timeframe. The goal is to create a page that makes it understandable what experiments are beneficial to the user, by measuring what happened in the user's life during that timeframe.
