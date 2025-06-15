import { JournalClient } from './journalClient';

/**
 * Test client for the Journal API
 * This class demonstrates how to use the JournalClient
 * and can be used for testing the backend API
 */
export class JournalTestClient {
  private client: JournalClient;
  private loggedIn: boolean = false;
  
  constructor(baseUrl: string = 'http://localhost:3000') {
    this.client = new JournalClient(baseUrl);
    console.log('Test client initialized with base URL:', baseUrl);
  }
  
  /**
   * Run a test scenario
   */
  async runTests(): Promise<void> {
    try {
      // Step 1: Register a test user
      await this.registerUser();
      
      // Step 2: Create and manage quests
      await this.questTests();
      
      // Step 3: Create and analyze journal entries
      await this.journalTests();
      
      // Step 4: Create character stats and manage tasks
      await this.characterStatAndTaskTests();
      
      // Step 5: Test conversations with AI assistant
      await this.conversationTests();
      
      // Step 6: Test experiments functionality
      await this.experimentTests();
      
      console.log('\n✅ All tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Test failed:', error);
    }
  }
  
  /**
   * Register a test user
   */
  private async registerUser(): Promise<void> {
    console.log('\n📝 Testing user registration...');
    
    try {
      // Generate a unique email to avoid conflicts
      const timestamp = new Date().getTime();
      const email = `test-user-${timestamp}@example.com`;
      
      const result = await this.client.register({
        email,
        password: 'password123',
        name: 'Test User',
        timezone: 'America/New_York',
      });
      
      console.log('✓ User registered successfully:', result.user.name);
      
      // Set token for subsequent requests
      this.client.setToken(result.token);
      this.loggedIn = true;
      
      // Verify user data
      const meResult = await this.client.getCurrentUser();
      console.log('✓ User data retrieved successfully:', meResult.user.name);
      
    } catch (error) {
      console.error('✗ User registration failed:', error);
      throw error;
    }
  }
  
  /**
   * Run quest-related tests
   */
  private async questTests(): Promise<void> {
    console.log('\n📚 Testing quest functionality...');
    
    try {
      // Create a quest
      const quest = await this.client.createQuest({
        title: 'Learn to rollerblade',
        description: 'Become proficient at rollerblading to enjoy the outdoors more',
      });
      
      console.log('✓ Created quest:', quest.quest.title);
      
      // Create milestones
      const milestone1 = await this.client.createQuestMilestone({
        questId: quest.quest.id,
        title: 'Learn how to brake',
        description: 'Master the T-stop braking technique',
      });
      
      const milestone2 = await this.client.createQuestMilestone({
        questId: quest.quest.id,
        title: 'Practice for 30 minutes daily',
        description: 'Build muscle memory through consistent practice',
      });
      
      console.log('✓ Created milestones');
      
      // Retrieve quest with milestones
      const questDetails = await this.client.getQuestById(quest.quest.id);
      console.log('✓ Retrieved quest with milestones:', questDetails.milestones.length);
      
      // Complete a milestone
      const completedMilestone = await this.client.completeMilestone(milestone1.milestone.id);
      console.log('✓ Completed milestone:', completedMilestone.milestone.title);
      
      // Update quest
      const updatedQuest = await this.client.updateQuest(quest.quest.id, {
        title: 'Master rollerblading',
        description: 'Become an expert rollerblader and practice advanced techniques',
      });
      
      console.log('✓ Updated quest:', updatedQuest.quest.title);
      
      // List all quests
      const quests = await this.client.getQuests();
      console.log(`✓ Retrieved ${quests.quests.length} quests`);
      
    } catch (error) {
      console.error('✗ Quest tests failed:', error);
      throw error;
    }
  }
  
  /**
   * Run journal-related tests
   */
  private async journalTests(): Promise<void> {
    console.log('\n📔 Testing journal functionality...');
    
    try {
      // Create a journal entry
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const journalEntry = await this.client.createJournalEntry({
        content: `Today I went rollerblading in the park for the first time. It was a bit scary at first, but I managed to stay upright most of the time! I practiced for about an hour and only fell twice. I'm proud of myself for trying something new and pushing through the fear. I need to work on my braking technique though, as I had to run into the grass to stop a few times.`,
        date: today,
      });
      
      console.log('✓ Created journal entry');
      
      // Analyze the journal entry
      const analysis = await this.client.analyzeJournalEntry({
        journalEntryId: journalEntry.entry.id,
      });
      
      console.log('✓ Analyzed journal entry');
      console.log('   - Title:', analysis.analysis.title);
      console.log('   - Synopsis:', analysis.analysis.synopsis);
      
      // List journal entries
      const entries = await this.client.getJournalEntries();
      console.log(`✓ Retrieved ${entries.entries.length} journal entries`);
      
      // Retrieve specific journal entry
      const retrievedEntry = await this.client.getJournalEntryById(journalEntry.entry.id);
      console.log('✓ Retrieved specific journal entry');
      
      // Update journal entry
      const updatedEntry = await this.client.updateJournalEntry(journalEntry.entry.id, {
        content: `${journalEntry.entry.content}\n\nUpdate: I went back to practice again in the evening and felt much more confident!`,
        date: today,
      });
      
      console.log('✓ Updated journal entry');
      
    } catch (error) {
      console.error('✗ Journal tests failed:', error);
      throw error;
    }
  }
  
  /**
   * Run character stat and task-related tests
   */
  private async characterStatAndTaskTests(): Promise<void> {
    console.log('\n🏆 Testing character stats and tasks functionality...');
    
    try {
      // Create character stats
      const fitnessStat = await this.client.createCharacterStat({
        name: 'Fitness',
        description: 'Physical health and endurance',
      });
      
      const creativityStat = await this.client.createCharacterStat({
        name: 'Creativity',
        description: 'Artistic and imaginative abilities',
      });
      
      console.log('✓ Created character stats:', fitnessStat.characterStat.name, 'and', creativityStat.characterStat.name);
      
      // List character stats
      const stats = await this.client.getCharacterStats();
      console.log(`✓ Retrieved ${stats.characterStats.length} character stats`);
      
      // Create a task linked to character stats
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekDate = nextWeek.toISOString().split('T')[0];
      
      // Create a quest first to link to the task
      const quest = await this.client.createQuest({
        title: 'Get fit for summer',
        description: 'Improve fitness and endurance levels',
      });
      
      const task = await this.client.createTask({
        title: 'Go for a 5k run',
        description: 'Complete a 5k run at a comfortable pace',
        dueDate: nextWeekDate,
        questId: quest.quest.id,
        characterStatIds: [
          { id: fitnessStat.characterStat.id, xp: 50 }
        ],
      });
      
      console.log('✓ Created task:', task.task.title);
      
      // Retrieve task
      const retrievedTask = await this.client.getTaskById(task.task.id);
      console.log('✓ Retrieved task with details');
      
      // Complete task
      const completedTask = await this.client.completeTask(task.task.id);
      console.log('✓ Completed task:', completedTask.task.title);
      
      // Verify XP was awarded by checking character stat
      const updatedStat = await this.client.getCharacterStatById(fitnessStat.characterStat.id);
      console.log(`✓ Character stat ${updatedStat.characterStat.name} now has ${updatedStat.characterStat.currentXP} XP`);
      
      // List all tasks
      const tasks = await this.client.getTasks();
      console.log(`✓ Retrieved ${tasks.tasks.length} tasks`);
      
    } catch (error) {
      console.error('✗ Character stats and tasks tests failed:', error);
      throw error;
    }
  }
  
  /**
   * Run conversation-related tests with AI assistant
   */
  private async conversationTests(): Promise<void> {
    console.log('\n💬 Testing conversation functionality with AI assistant...');
    
    try {
      // Create user context for AI
      await this.client.setUserContext({
        key: 'goals',
        value: 'Improve fitness, learn rollerblading, and enhance creativity',
      });
      
      await this.client.setUserContext({
        key: 'challenges',
        value: 'Finding time for consistent exercise and creative pursuits',
      });
      
      console.log('✓ Set user context for AI');
      
      // Retrieve user context
      const context = await this.client.getUserContext();
      console.log(`✓ Retrieved ${Object.keys(context.context).length} context items`);
      
      // Create a conversation
      const conversation = await this.client.createConversation({
        title: 'Fitness planning',
      });
      
      console.log('✓ Created conversation:', conversation.conversation.title);
      
      // Send a message and get AI response
      const messageResponse = await this.client.sendMessage({
        conversationId: conversation.conversation.id,
        content: 'I want to improve my fitness level but struggle with consistency. Can you help me create a simple weekly plan that includes rollerblading?',
      });
      
      console.log('✓ Sent message and received AI response');
      console.log(`   User: ${messageResponse.messages[0].content.substring(0, 50)}...`);
      console.log(`   AI: ${messageResponse.messages[1].content.substring(0, 50)}...`);
      
      // Update conversation title
      const updatedConversation = await this.client.updateConversation(
        conversation.conversation.id,
        { title: 'Fitness and Consistency Plan' }
      );
      
      console.log('✓ Updated conversation title to:', updatedConversation.conversation.title);
      
      // List conversations
      const conversations = await this.client.getConversations();
      console.log(`✓ Retrieved ${conversations.conversations.length} conversations`);
      
      // Retrieve specific conversation with messages
      const retrievedConversation = await this.client.getConversationById(conversation.conversation.id);
      console.log(`✓ Retrieved conversation with ${retrievedConversation.conversation.messages?.length} messages`);
      
    } catch (error) {
      console.error('✗ Conversation tests failed:', error);
      throw error;
    }
  }
  
  /**
   * Run tests for the experiment functionality
   */
  private async experimentTests(): Promise<void> {
    console.log('\n🔬 Testing experiment functionality...');
    
    try {
      // Create a start date (today) and end date (30 days from now)
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30);
      
      const startDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const endDateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Create an experiment
      const experiment = await this.client.createExperiment({
        title: "Daily Meditation Practice",
        description: "Testing if 10 minutes of daily meditation reduces stress levels",
        startDate: startDateStr,
        endDate: endDateStr,
        successCriteria: "Feeling calmer and more focused after 30 days",
      });
      
      console.log('✓ Created experiment:', experiment.experiment.title);
      
      // Create a task linked to the experiment
      const task = await this.client.createTask({
        title: "Meditate for 10 minutes",
        description: "Find a quiet place, set a timer, and focus on your breath",
        dueDate: startDateStr,
        experimentId: experiment.experiment.id,
      });
      
      console.log('✓ Created task linked to experiment:', task.task.title);
      
      // Retrieve the experiment details
      const experimentDetails = await this.client.getExperimentById(experiment.experiment.id);
      console.log('✓ Retrieved experiment details:', experimentDetails.experiment.title);
      
      // Update the experiment
      const updatedExperiment = await this.client.updateExperiment(experiment.experiment.id, {
        title: "Daily Meditation Practice",
        description: "Testing if 15 minutes of daily meditation reduces stress and improves focus",
        startDate: startDateStr,
        endDate: endDateStr,
        successCriteria: "Noticeable reduction in stress levels and improved focus after 30 days",
      });
      
      console.log('✓ Updated experiment:', updatedExperiment.experiment.description?.substring(0, 50) + '...');
      
      // Complete the experiment as successful
      const completedExperiment = await this.client.completeExperiment(experiment.experiment.id, true);
      console.log('✓ Completed experiment successfully:', completedExperiment.experiment.isSuccessful);
      
      // List all experiments
      const experiments = await this.client.getExperiments();
      console.log(`✓ Retrieved ${experiments.experiments.length} experiments`);
      
    } catch (error) {
      console.error('✗ Experiment tests failed:', error);
      throw error;
    }
  }
}
