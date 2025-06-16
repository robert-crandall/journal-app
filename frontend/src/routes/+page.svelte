<script lang="ts">
  import { authStore } from '$lib/stores/auth';
  import { MessageCircle, Target, BookOpen, Settings } from 'lucide-svelte';

  let isAuthenticated = $derived($authStore.isAuthenticated);
  let user = $derived($authStore.user);
</script>

<svelte:head>
  <title>Journal App - Your Personal Life Coach</title>
  <meta name="description" content="A chat-first life coaching app with AI-powered insights and guidance." />
</svelte:head>

<div class="hero min-h-[60vh] bg-gradient-to-br from-primary/10 to-secondary/10">
  <div class="hero-content text-center">
    <div class="max-w-md">
      {#if isAuthenticated && user}
        <h1 class="text-5xl font-bold">Welcome back, {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.email.split('@')[0]}!</h1>
        <p class="py-6">Ready to continue your journey? Let's chat with your AI coach and work on your goals.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/chat" class="btn btn-primary">
            <MessageCircle size={20} />
            Start Chatting
          </a>
          <a href="/quests" class="btn btn-outline">
            <Target size={20} />
            View Quests
          </a>
        </div>
      {:else}
        <h1 class="text-5xl font-bold">Welcome to Journal App</h1>
        <p class="py-6">Your personal AI-powered life coach. Track your journey, set goals, and get personalized guidance through meaningful conversations.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/register" class="btn btn-primary">Get Started</a>
          <a href="/login" class="btn btn-outline">Sign In</a>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Features section -->
<div class="py-16">
  <div class="text-center mb-12">
    <h2 class="text-3xl font-bold mb-4">Everything you need for personal growth</h2>
    <p class="text-base-content/70 max-w-2xl mx-auto">
      Our AI-powered platform combines journaling, goal tracking, and personalized coaching in one seamless experience.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
    <!-- Conversational AI -->
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body items-center text-center">
        <MessageCircle size={48} class="text-primary mb-4" />
        <h3 class="card-title">AI Coach</h3>
        <p class="text-sm text-base-content/70">
          Chat naturally with your personal AI coach for guidance and insights.
        </p>
      </div>
    </div>

    <!-- Quests & Goals -->
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body items-center text-center">
        <Target size={48} class="text-secondary mb-4" />
        <h3 class="card-title">Quests</h3>
        <p class="text-sm text-base-content/70">
          Set meaningful goals and track your progress with AI-generated tasks.
        </p>
      </div>
    </div>

    <!-- Journaling -->
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body items-center text-center">
        <BookOpen size={48} class="text-accent mb-4" />
        <h3 class="card-title">Journaling</h3>
        <p class="text-sm text-base-content/70">
          Reflect on your thoughts and experiences with AI-powered insights.
        </p>
      </div>
    </div>

    <!-- Personalization -->
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body items-center text-center">
        <Settings size={48} class="text-info mb-4" />
        <h3 class="card-title">Personalized</h3>
        <p class="text-sm text-base-content/70">
          Customize your experience based on your interests and goals.
        </p>
      </div>
    </div>
  </div>
</div>

{#if isAuthenticated}
  <!-- Quick actions for authenticated users -->
  <div class="divider"></div>
  
  <div class="text-center py-8">
    <h2 class="text-2xl font-bold mb-6">Quick Actions</h2>
    <div class="flex flex-wrap gap-4 justify-center">
      <a href="/profile" class="btn btn-ghost">
        Update Profile
      </a>
      <a href="/context" class="btn btn-ghost">
        Set Context
      </a>
      <a href="/preferences" class="btn btn-ghost">
        Preferences
      </a>
    </div>
  </div>
{/if}
