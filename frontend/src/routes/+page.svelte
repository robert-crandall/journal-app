<script lang="ts">
  import { authStore, type User } from '$lib/stores/auth';
  import Navigation from '$lib/components/Navigation.svelte';
  import DailyFocusWidget from '$lib/components/focus/DailyFocusWidget.svelte';
  import WeatherWidget from '$lib/components/weather/WeatherWidget.svelte';
  import SimpleTodosWidget from '$lib/components/todos/SimpleTodosWidget.svelte';
  import ExperimentTasksWidget from '$lib/components/experiments/ExperimentTasksWidget.svelte';
  import JournalWidget from '$lib/components/journal/JournalWidget.svelte';
  import GenerateTasksWidget from '$lib/components/generate-tasks/GenerateTasksWidget.svelte';

  let user: User | null = null;
  let token: string | null = null;
  let loading = false;

  // Subscribe to auth store
  authStore.subscribe((state) => {
    user = state.user;
    token = state.token;
    loading = state.loading;
  });
</script>

<svelte:head>
  <title>Home | LifeQuest</title>
</svelte:head>

<div class="min-h-screen">
  <!-- Main content -->
  <main class="mx-auto w-full max-w-7xl px-3 sm:px-4">
    <div class="flex flex-1 flex-col items-center justify-center py-12 sm:py-20">
      {#if user}
        <!-- Logged-in View -->
        <section class="flex w-full max-w-full flex-col items-center sm:max-w-2xl">
          <div class="hero-content mb-6 text-center sm:mb-8">
            <div>
              <h1 class="text-primary mb-2 text-3xl font-bold sm:mb-3 sm:text-4xl">
                Welcome back, {user.name}!
              </h1>
              <p class="text-base-content/70 max-w-lg text-lg sm:text-xl">You're successfully logged in to your account.</p>
            </div>
          </div>

          <div class="card bg-base-100 w-full shadow-xl">
            <div class="card-body p-3 sm:p-6">
              <!-- Widgets Container -->
              <div class="space-y-4 sm:space-y-6">
                <!-- AI Task Generation Widget -->
                <div>
                  <GenerateTasksWidget />
                </div>

                <div class="divider my-3 sm:my-4"></div>

                <!-- Daily Focus Widget -->
                <div>
                  <DailyFocusWidget />
                </div>

                <!-- Weather Widget -->
                <div>
                  <WeatherWidget />
                </div>

                <div class="divider my-3 sm:my-4"></div>
                <!-- Experiment Tasks Widget -->
                <div>
                  <ExperimentTasksWidget />
                </div>

                <div>
                  <SimpleTodosWidget showTitle={false} />
                </div>

                <!-- Journal Widget -->
                <div>
                  <JournalWidget />
                </div>
              </div>

              <div class="divider my-3 sm:my-4"></div>
            </div>
          </div>
        </section>
      {:else}
        <!-- Landing Page View -->
        <section class="hero px-2 sm:px-4">
          <div class="hero-content max-w-full flex-col sm:max-w-5xl lg:flex-row-reverse">
            <!-- Right side illustration/image -->
            <div class="my-6 flex flex-1 items-center justify-center lg:my-0">
              <div class="mockup-browser bg-base-300 w-full max-w-xs border sm:max-w-sm">
                <div class="mockup-browser-toolbar">
                  <div class="input text-xs sm:text-sm">auth-template.dev</div>
                </div>
                <div class="bg-base-200 flex justify-center">
                  <div class="flex w-full flex-col gap-2 p-3 sm:gap-3 sm:p-4">
                    <div class="skeleton h-6 w-3/4 sm:h-8"></div>
                    <div class="skeleton h-3 w-1/2 sm:h-4"></div>
                    <div class="skeleton h-3 w-2/3 sm:h-4"></div>
                    <div class="mt-3 flex gap-2 sm:mt-4">
                      <div class="btn btn-primary btn-xs sm:btn-sm flex-1">Get Started</div>
                      <div class="btn btn-outline btn-xs sm:btn-sm">Login</div>
                    </div>
                    <div class="skeleton mt-3 h-24 w-full sm:mt-4 sm:h-32"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Left side content -->
            <div class="max-w-full flex-1 px-1 sm:max-w-xl sm:px-0">
              <h1 class="mb-3 text-center text-3xl leading-tight font-bold sm:mb-4 sm:text-4xl md:text-5xl lg:text-left">
                <span class="text-gradient"> Modern Journal App </span>
              </h1>
              <p class="text-base-content/80 mb-6 text-center text-lg sm:mb-8 sm:text-xl lg:text-left">
                A sleek SvelteKit application with user authentication powered by Hono backend. The perfect starting point for your next project.
              </p>

              <div class="mb-6 flex items-center justify-center gap-3 sm:mb-8 sm:gap-4 lg:justify-start">
                <a href="/register" class="btn btn-primary btn-md sm:btn-lg">
                  Get Started
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-3 w-3 sm:h-4 sm:w-4"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </a>
                <a href="/login" class="btn btn-outline btn-md sm:btn-lg"> Login </a>
              </div>

              <!-- Feature badges -->
              <div class="flex flex-wrap justify-center gap-2 sm:gap-3 lg:justify-start">
                <div class="badge badge-primary badge-sm sm:badge-md">Type-Safe</div>
                <div class="badge badge-secondary badge-sm sm:badge-md">SvelteKit</div>
                <div class="badge badge-accent badge-sm sm:badge-md">Hono Backend</div>
                <div class="badge badge-success badge-sm sm:badge-md">JWT Auth</div>
              </div>
            </div>
          </div>
        </section>
      {/if}
    </div>
  </main>
</div>
