<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { projectsApi, type ProjectWithRelations, type ProjectFilters } from '$lib/api/projects';
  import { Plus, FolderOpen, Calendar, Clock, CheckCircle, XCircle, Archive, Edit3, Eye, Filter, RotateCcw, MapPin } from 'lucide-svelte';

  // Reactive state for projects data
  let userProjects: ProjectWithRelations[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let filterType = $state<string>('');
  let filterStatus = $state<string>('active');

  // Load data on component mount
  onMount(async () => {
    await loadProjectsData();
  });

  // Separate function to load projects data
  async function loadProjectsData() {
    try {
      loading = true;
      error = null;

      const filters: ProjectFilters = {};
      if (filterType) filters.type = filterType as 'project' | 'adventure';
      if (filterStatus) filters.status = filterStatus as 'active' | 'completed' | 'cancelled';

      const projectsData = await projectsApi.getUserProjects(filters);
      userProjects = projectsData;
    } catch (err) {
      console.error('Failed to load projects:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load projects';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function getProjectIcon(project: ProjectWithRelations) {
    if (project.type === 'adventure') return '🗺️';
    return '📁'; // Project
  }

  function getStatusColor(project: ProjectWithRelations) {
    if (project.isCompleted) return 'badge-success';
    if (!project.isActive) return 'badge-error';
    return 'badge-warning';
  }

  function getStatusText(project: ProjectWithRelations): string {
    if (project.isCompleted) return 'completed';
    if (!project.isActive) return 'cancelled';
    return 'active';
  }

  function formatDate(dateString: Date | string | null): string {
    if (!dateString) return 'No date set';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function calculateProgress(project: ProjectWithRelations): number {
    if (!project.subtasks || project.subtasks.length === 0) return 0;
    const completed = project.subtasks.filter(subtask => subtask.isCompleted).length;
    return Math.round((completed / project.subtasks.length) * 100);
  }

  function getProgressColor(progress: number): string {
    if (progress >= 80) return 'progress-success';
    if (progress >= 50) return 'progress-warning';
    return 'progress-error';
  }

  // Navigation functions
  function createProject() {
    goto('/projects/create');
  }

  function editProject(projectId: string) {
    goto(`/projects/${projectId}/edit`);
  }

  function viewProjectDetails(projectId: string) {
    goto(`/projects/${projectId}`);
  }

  // Project actions
  async function completeProject(project: ProjectWithRelations) {
    const notes = prompt(`Add completion notes for "${project.title}" (optional):`);
    
    try {
      await projectsApi.completeProject(project.id, notes || undefined);
      await loadProjectsData(); // Refresh the list
    } catch (err) {
      console.error('Failed to complete project:', err);
      error = err instanceof Error ? err.message : 'Failed to complete project';
    }
  }

  async function cancelProject(project: ProjectWithRelations) {
    const reason = prompt(`Why are you cancelling "${project.title}"? (optional):`);
    
    if (!confirm(`Are you sure you want to cancel "${project.title}"?`)) {
      return;
    }

    try {
      await projectsApi.cancelProject(project.id, reason || undefined);
      await loadProjectsData(); // Refresh the list
    } catch (err) {
      console.error('Failed to cancel project:', err);
      error = err instanceof Error ? err.message : 'Failed to cancel project';
    }
  }

  // Filter handlers
  async function handleFilterChange() {
    await loadProjectsData();
  }
</script>

<svelte:head>
  <title>Projects & Adventures - Gamified Life</title>
  <meta name="description" content="Manage your projects and adventures with organized subtasks" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <!-- Page Header -->
  <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
    <div class="mx-auto max-w-7xl px-4 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-primary mb-2 text-4xl font-bold">Projects & Adventures</h1>
          <p class="text-base-content/70 text-lg">Multi-step efforts with organized subtasks</p>
        </div>
        <div class="flex gap-3">
          <button onclick={createProject} class="btn btn-primary btn-lg gap-2 shadow-lg transition-all duration-200 hover:scale-105">
            <Plus size={20} />
            Create Project
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Filters Section -->
  <div class="mx-auto max-w-7xl px-4 py-6">
    <div class="card bg-base-100 border-base-300 border shadow-xl">
      <div class="card-body p-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <Filter size={16} />
            <span class="font-medium">Filters:</span>
          </div>
          
          <div class="form-control">
            <label class="label" for="typeFilter">
              <span class="label-text">Type</span>
            </label>
            <select 
              id="typeFilter"
              bind:value={filterType} 
              onchange={handleFilterChange}
              class="select select-bordered select-sm w-36"
            >
              <option value="">All Types</option>
              <option value="project">Projects</option>
              <option value="adventure">Adventures</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label" for="statusFilter">
              <span class="label-text">Status</span>
            </label>
            <select 
              id="statusFilter"
              bind:value={filterStatus} 
              onchange={handleFilterChange}
              class="select select-bordered select-sm w-36"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <button onclick={async () => { filterType = ''; filterStatus = 'active'; await loadProjectsData(); }} class="btn btn-ghost btn-sm gap-2">
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="mx-auto max-w-7xl px-4 pb-8">
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading your projects...</p>
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="alert alert-error mx-auto max-w-md">
        <div class="flex items-center gap-3">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{error}</span>
        </div>
      </div>
    {:else}
      <!-- Projects Grid Layout -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Projects Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          {#if userProjects.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">
                Your {filterType ? (filterType === 'project' ? 'Projects' : 'Adventures') : 'Projects & Adventures'}
              </h2>
              <div class="grid gap-6 md:grid-cols-2">
                {#each userProjects as project}
                  <div class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
                    <div class="card-body p-6">
                      <div class="mb-4 flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="text-2xl">
                            {getProjectIcon(project)}
                          </div>
                          <div class="flex-1">
                            <h3 class="text-lg font-bold">{project.title}</h3>
                            <p class="text-base-content/60 text-sm capitalize">{project.type}</p>
                          </div>
                        </div>

                        <!-- Status Badge -->
                        <div class="badge {getStatusColor(project)} gap-1">
                          {#if project.isCompleted}
                            <CheckCircle size={12} />
                          {:else if !project.isActive}
                            <XCircle size={12} />
                          {:else}
                            <Clock size={12} />
                          {/if}
                          {getStatusText(project)}
                        </div>
                      </div>

                      {#if project.description}
                        <p class="text-base-content/80 mb-4 text-sm">{project.description}</p>
                      {/if}

                      <!-- Progress Bar -->
                      {#if project.subtasks && project.subtasks.length > 0}
                        <div class="mb-4">
                          <div class="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{calculateProgress(project)}%</span>
                          </div>
                          <progress 
                            class="progress {getProgressColor(calculateProgress(project))} w-full" 
                            value={calculateProgress(project)} 
                            max="100"
                          ></progress>
                          <p class="text-xs text-base-content/60 mt-1">
                            {project.subtasks.filter(s => s.isCompleted).length} of {project.subtasks.length} tasks completed
                          </p>
                        </div>
                      {/if}

                      <!-- Project Details -->
                      <div class="mb-4 space-y-2">
                        <div class="flex items-center gap-2 text-sm">
                          <Calendar size={14} />
                          <span>
                            {formatDate(project.startDate)} → {formatDate(project.targetDate)}
                          </span>
                        </div>

                        {#if project.goal}
                          <div class="text-sm">
                            <span class="badge badge-secondary badge-xs">Goal: {project.goal.title}</span>
                          </div>
                        {/if}

                        {#if project.subtasks && project.subtasks.length > 0}
                          <div class="text-sm">
                            <span class="badge badge-outline badge-xs">{project.subtasks.length} subtasks</span>
                          </div>
                        {/if}
                      </div>

                      <!-- Action Buttons -->
                      <div class="flex flex-wrap gap-2">
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewProjectDetails(project.id)}>
                          <Eye size={14} />
                          View
                        </button>
                        
                        {#if project.isActive && !project.isCompleted}
                          <button class="btn btn-ghost btn-sm gap-1" onclick={() => editProject(project.id)}>
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button class="btn btn-success btn-sm gap-1" onclick={() => completeProject(project)}>
                            <CheckCircle size={14} />
                            Complete
                          </button>
                          <button class="btn btn-warning btn-sm gap-1" onclick={() => cancelProject(project)}>
                            <XCircle size={14} />
                            Cancel
                          </button>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </section>
          {:else}
            <!-- Empty State -->
            <section>
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body py-12 text-center">
                  <div class="avatar placeholder mb-6">
                    <div class="bg-base-300 text-base-content w-20 rounded-full">
                      <FolderOpen size={40} />
                    </div>
                  </div>
                  <h3 class="mb-2 text-xl font-semibold">No Projects Found</h3>
                  <p class="text-base-content/60 mb-6">
                    {filterType || filterStatus 
                      ? 'No projects match your current filters.' 
                      : 'Start your first project to organize multi-step efforts.'}
                  </p>
                  <button onclick={createProject} class="btn btn-primary btn-lg gap-2">
                    <Plus size={20} />
                    Create Your First Project
                  </button>
                </div>
              </div>
            </section>
          {/if}
        </div>

        <!-- Sidebar (1/4 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Quick Stats Card -->
            <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
              <div class="card-body p-6">
                <h3 class="text-primary mb-4 font-semibold">Quick Stats</h3>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm">Total:</span>
                    <span class="font-medium">{userProjects.length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Active:</span>
                    <span class="font-medium">{userProjects.filter(p => p.isActive && !p.isCompleted).length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Completed:</span>
                    <span class="font-medium">{userProjects.filter(p => p.isCompleted).length}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-sm">Adventures:</span>
                    <span class="font-medium">{userProjects.filter(p => p.type === 'adventure').length}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Project Types Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">💡 Project Types</h3>
                <div class="space-y-3 text-sm">
                  <div class="flex items-start gap-2">
                    <span class="text-lg">📁</span>
                    <div>
                      <span class="font-medium">Projects:</span>
                      <p class="text-base-content/70">Practical/maintenance efforts</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-2">
                    <span class="text-lg">🗺️</span>
                    <div>
                      <span class="font-medium">Adventures:</span>
                      <p class="text-base-content/70">Fun/exploratory activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Quick Actions</h3>
                <div class="space-y-2">
                  <button onclick={createProject} class="btn btn-outline btn-sm w-full gap-2">
                    <Plus size={16} />
                    Create New Project
                  </button>
                  <button onclick={() => goto('/tasks')} class="btn btn-outline btn-sm w-full gap-2">
                    <Archive size={16} />
                    View Tasks
                  </button>
                  <button onclick={() => goto('/quests')} class="btn btn-outline btn-sm w-full gap-2">
                    <MapPin size={16} />
                    View Quests
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
