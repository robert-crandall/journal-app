import { JournalApiClient } from './index';

async function runDemo() {
  console.log('🚀 Starting Journal App API Demo - Phase 2 Features...\n');

  const client = new JournalApiClient({
    baseUrl: 'http://localhost:3000',
  });

  try {
    // Test health check
    console.log('📊 Testing health check...');
    const health = await client.healthCheck();
    console.log('✅ Health check:', health.success);

    // Test user registration
    console.log('\n👤 Testing user registration...');
    const registerResult = await client.register({
      email: `demo-${Date.now()}@example.com`,
      password: 'demo123456',
      firstName: 'Demo',
      lastName: 'User',
    });
    console.log('✅ Registration successful:', registerResult.success);

    if (!registerResult.success) {
      console.error('❌ Registration failed:', registerResult.error);
      return;
    }

    console.log('🔐 User token set automatically');

    // Test dashboard
    console.log('\n📈 Testing dashboard...');
    const dashboard = await client.getDashboard();
    console.log('✅ Dashboard data retrieved');
    console.log(`  - Welcome: ${dashboard.data?.welcome.message}`);
    console.log(`  - Date: ${dashboard.data?.welcome.date.formatted}`);

    // Test creating tasks
    console.log('\n✅ Testing task creation...');
    const task1 = await client.createTask({
      title: 'Complete Phase 2 development',
      description: 'Implement dashboard and basic functionality',
      dueDate: '2025-06-20',
    });
    console.log('✅ Task 1 created:', task1.data?.title);

    const task2 = await client.createTask({
      title: 'Review and test API endpoints',
      description: 'Ensure all endpoints work correctly',
    });
    console.log('✅ Task 2 created:', task2.data?.title);

    // Test getting tasks
    console.log('\n📋 Testing task retrieval...');
    const tasks = await client.getTasks();
    console.log(`✅ Retrieved ${tasks.data?.length} tasks`);

    // Test task stats
    console.log('\n📊 Testing task statistics...');
    const taskStats = await client.getTaskStats();
    console.log('✅ Task stats:', taskStats.data);

    // Test toggling task completion
    if (task1.data?.id) {
      console.log('\n🔄 Testing task toggle...');
      const toggledTask = await client.toggleTask(task1.data.id);
      console.log('✅ Task toggled, completed:', toggledTask.data?.isCompleted);
    }

    // Test creating journal entries
    console.log('\n📝 Testing journal entry creation...');
    const entry1 = await client.createJournalEntry({
      title: 'Day 1 of Phase 2',
      content: 'Started implementing the dashboard and task management features. Everything is going well so far.',
    });
    console.log('✅ Journal entry 1 created:', entry1.data?.title);

    const entry2 = await client.createJournalEntry({
      content: 'Just finished the API endpoints for tasks and journal entries. The backend is looking solid!',
    });
    console.log('✅ Journal entry 2 created (no title)');

    // Test getting journal entries
    console.log('\n📖 Testing journal entry retrieval...');
    const entries = await client.getJournalEntries();
    console.log(`✅ Retrieved ${entries.data?.length} journal entries`);

    // Test recent journal entries
    console.log('\n📑 Testing recent journal entries...');
    const recentEntries = await client.getRecentJournalEntries(2);
    console.log(`✅ Retrieved ${recentEntries.data?.length} recent entries`);

    // Test journal stats
    console.log('\n📊 Testing journal statistics...');
    const journalStats = await client.getJournalStats();
    console.log('✅ Journal stats:', journalStats.data);

    // Test updated dashboard
    console.log('\n📈 Testing updated dashboard...');
    const updatedDashboard = await client.getDashboard();
    console.log('✅ Updated dashboard data:');
    console.log(`  - Welcome: ${updatedDashboard.data?.welcome.message}`);
    console.log(`  - Tasks: ${updatedDashboard.data?.tasks.stats.total} total, ${updatedDashboard.data?.tasks.stats.completed} completed`);
    console.log(`  - Journal: ${updatedDashboard.data?.journal.stats.total} total entries`);

    // Test user profile
    console.log('\n👤 Testing user profile...');
    const profile = await client.getProfile();
    console.log('✅ User profile:', profile.data?.firstName, profile.data?.lastName);

    // Test updating profile
    console.log('\n✏️ Testing profile update...');
    const updatedProfile = await client.updateProfile({
      firstName: 'Demo Updated',
      lastName: 'User Updated',
    });
    console.log('✅ Profile updated:', updatedProfile.data?.firstName, updatedProfile.data?.lastName);

    // Test user context
    console.log('\n📝 Testing user context...');
    const contextResult = await client.updateContext([
      { key: 'interests', values: ['coding', 'reading', 'hiking'] },
      { key: 'goals', values: ['learn TypeScript', 'build apps', 'stay healthy'] },
    ]);
    console.log('✅ Context updated:', contextResult.data?.length, 'items');

    // Test preferences
    console.log('\n🎨 Testing user preferences...');
    const prefsResult = await client.updatePreferences({
      theme: 'dark',
      accentColor: 'purple',
      timezone: 'America/New_York',
    });
    console.log('✅ Preferences updated:', prefsResult.data);

    console.log('\n🎉 Demo completed successfully!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };
