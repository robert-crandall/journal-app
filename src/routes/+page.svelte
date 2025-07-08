<script lang="ts">
  import ThemeSelector from '$lib/components/ThemeSelector.svelte';
  import { ArrowRight, BookOpen, Shield, Smartphone } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Journal App - Modern Journaling</title>
</svelte:head>

<!-- Gradient Background -->
<div class="min-h-screen bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
  <!-- Navigation -->
  <div class="navbar bg-primary text-primary-content shadow-lg">
    <div class="navbar-start">
      <a href="/" class="btn btn-ghost text-xl font-bold text-primary-content hover:bg-primary-content/10">Life Quest</a>
    </div>
    <div class="navbar-end gap-2">
      <ThemeSelector />
      <a href="/login" class="btn btn-ghost text-primary-content hover:bg-primary-content/10">Login</a>
      <a href="/register" class="btn btn-secondary">Register</a>
    </div>
  </div>

  <!-- Hero Section -->
  <div class="container mx-auto px-4 py-16">
    <div class="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-8rem)]">
      <!-- Left Content -->
      <div class="space-y-8">
        <div class="space-y-6">
          <h1 class="text-4xl lg:text-6xl font-bold leading-tight">
            <span class="text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Modern Journal
            </span>
            <br />
            <span class="text-base-content">Template</span>
          </h1>
          
          <p class="text-lg lg:text-xl text-base-content/70 max-w-lg leading-relaxed">
            A sleek SvelteKit application with user authentication powered by Hono backend. The perfect starting point for your next project.
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4">
          <a href="/register" class="btn btn-primary btn-lg group">
            Get Started
            <ArrowRight size={20} class="group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="/login" class="btn btn-outline btn-lg">Login</a>
        </div>

        <!-- Technology Badges -->
        <div class="flex flex-wrap gap-2">
          <div class="badge badge-primary badge-lg">Type-Safe</div>
          <div class="badge badge-secondary badge-lg">SvelteKit</div>
          <div class="badge badge-accent badge-lg">Hono Backend</div>
          <div class="badge badge-info badge-lg">JWT Auth</div>
        </div>
      </div>

      <!-- Right Mockup -->
      <div class="flex justify-center lg:justify-end">
        <div class="mockup-phone bg-base-300 shadow-2xl">
          <div class="camera"></div>
          <div class="display">
            <div class="artboard artboard-demo phone-1 bg-base-100">
              <!-- Mock Browser Bar -->
              <div class="flex items-center gap-2 p-4 border-b border-base-300">
                <div class="flex gap-1">
                  <div class="w-3 h-3 rounded-full bg-error"></div>
                  <div class="w-3 h-3 rounded-full bg-warning"></div>
                  <div class="w-3 h-3 rounded-full bg-success"></div>
                </div>
                <div class="flex-1 bg-base-200 rounded px-3 py-1 text-xs text-base-content/60 text-center">
                  auth-template.dev
                </div>
              </div>
              
              <!-- Mock App Content -->
              <div class="p-6 space-y-4">
                <div class="text-center space-y-2">
                  <div class="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center">
                    <BookOpen size={24} class="text-primary-content" />
                  </div>
                  <h3 class="font-bold">Welcome Back</h3>
                  <p class="text-sm text-base-content/60">Ready to continue your journey?</p>
                </div>
                
                <div class="space-y-3">
                  <button class="btn btn-primary btn-block">Get Started</button>
                  <button class="btn btn-outline btn-block">Login</button>
                </div>
                
                <div class="grid grid-cols-3 gap-3 pt-4">
                  <div class="text-center">
                    <div class="w-8 h-8 bg-secondary/20 rounded mx-auto mb-1 flex items-center justify-center">
                      <Shield size={16} class="text-secondary" />
                    </div>
                    <span class="text-xs">Secure</span>
                  </div>
                  <div class="text-center">
                    <div class="w-8 h-8 bg-accent/20 rounded mx-auto mb-1 flex items-center justify-center">
                      <BookOpen size={16} class="text-accent" />
                    </div>
                    <span class="text-xs">Simple</span>
                  </div>
                  <div class="text-center">
                    <div class="w-8 h-8 bg-info/20 rounded mx-auto mb-1 flex items-center justify-center">
                      <Smartphone size={16} class="text-info" />
                    </div>
                    <span class="text-xs">Mobile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
