<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { goalAlignmentSummariesApi } from '$lib/api/goal-alignment-summaries';
  import type { GoalAlignmentSummaryResponse } from '$lib/types/goal-alignment-summaries';
  import { TargetIcon, TrashIcon, TrendingUpIcon, CheckCircleIcon, AlertCircleIcon, ClockIcon, ListIcon, ArrowRightIcon } from 'lucide-svelte';
  import { formatDateTime } from '$lib/utils/date';
  import Markdown from '$lib/components/common/Markdown.svelte';

  // State
  let summary: GoalAlignmentSummaryResponse | null = null;
  let loading = true;
  let error: string | null = null;
  let showDeleteModal = false;
  let deleting = false;

  // Get the summary ID from the URL
  $: summaryId = $page.params.id;

  onMount(async () => {
    if (summaryId) {
      await loadSummary();
    }
  });

  async function loadSummary() {
    try {
      loading = true;
      error = null;
      summary = await goalAlignmentSummariesApi.getSummary(summaryId);
    } catch (err) {
      console.error('Failed to load goal alignment summary:', err);
      error = err instanceof Error ? err.message : 'Failed to load goal alignment summary';
    } finally {
      loading = false;
    }
  }

  async function deleteSummary() {
    if (!summary) return;

    try {
      deleting = true;
      await goalAlignmentSummariesApi.deleteSummary(summary.id);
      goto('/goal-alignment-summaries');
    } catch (err) {
      console.error('Failed to delete summary:', err);
      error = err instanceof Error ? err.message : 'Failed to delete summary';
    } finally {
      deleting = false;
      showDeleteModal = false;
    }
  }

  function goBack() {
    goto('/goal-alignment-summaries');
  }

  function getAlignmentScoreClass(score: number | null): string {
    if (score === null) return 'text-base-content/50';
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  }

  function getAlignmentScoreText(score: number | null): string {
    if (score === null) return 'No Score';
    if (score >= 80) return 'Excellent Alignment';
    if (score >= 60) return 'Good Alignment';
    return 'Needs Improvement';
  }

  function getAlignmentScoreBadgeClass(score: number | null): string {
    if (score === null) return 'badge-ghost';
    if (score >= 80) return 'badge-success';
    if (score >= 60) return 'badge-warning';
    return 'badge-error';
  }
</script>

<svelte:head>
  <title>
    {summary ? `Goal Alignment Analysis: ${summary.periodStartDate} - ${summary.periodEndDate}` : 'Loading...'}
    - Life Quest
  </title>
</svelte:head>

<!-- Action Buttons -->
{#if summary}
  <div class="mb-6 flex justify-end">
    <button on:click={() => (showDeleteModal = true)} class="btn btn-error btn-outline btn-sm gap-2">
      <TrashIcon size={16} />
      Delete
    </button>
  </div>
{/if}

<!-- Loading State -->
{#if loading}
  <div class="flex items-center justify-center py-20">
    <div class="text-center">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="text-base-content/60 mt-4">Loading analysis...</p>
    </div>
  </div>

  <!-- Error State -->
{:else if error}
  <div class="card bg-error text-error-content shadow-xl">
    <div class="card-body text-center">
      <h2 class="card-title justify-center">
        <TargetIcon size={24} />
        Error Loading Analysis
      </h2>
      <p>{error}</p>
      <div class="card-actions justify-center">
        <button on:click={goBack} class="btn btn-neutral">Go Back</button>
        <button on:click={loadSummary} class="btn btn-neutral">Try Again</button>
      </div>
    </div>
  </div>

  <!-- Summary Content -->
{:else if summary}
  <!-- Alignment Score Overview -->
  <div class="card bg-base-100 border-base-300 mb-6 border shadow-xl">
    <div class="card-body">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="card-title">
          <TrendingUpIcon size={24} />
          Alignment Score
        </h2>
        <span class="badge {getAlignmentScoreBadgeClass(summary.alignmentScore)} badge-lg">
          {summary.alignmentScore !== null ? `${summary.alignmentScore}%` : 'No Score'}
        </span>
      </div>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
        <!-- Overall Score -->
        <div class="text-center">
          <div class="stat">
            <div class="stat-title">Overall Alignment</div>
            <div class="stat-value {getAlignmentScoreClass(summary.alignmentScore)}">
              {summary.alignmentScore !== null ? `${summary.alignmentScore}%` : 'N/A'}
            </div>
            <div class="stat-desc">{getAlignmentScoreText(summary.alignmentScore)}</div>
          </div>
        </div>

        <!-- Points Earned -->
        <div class="text-center">
          <div class="stat">
            <div class="stat-title">Points Earned</div>
            <div class="stat-value text-primary">{summary.totalPointsEarned}</div>
            <div class="stat-desc">out of {summary.totalPossiblePoints} possible</div>
          </div>
        </div>

        <!-- Aligned Goals -->
        <div class="text-center">
          <div class="stat">
            <div class="stat-title">Goals On Track</div>
            <div class="stat-value text-success">{summary.alignedGoals.length}</div>
            <div class="stat-desc">Making Progress</div>
          </div>
        </div>

        <!-- Neglected Goals -->
        <div class="text-center">
          <div class="stat">
            <div class="stat-title">Goals Needing Attention</div>
            <div class="stat-value text-warning">{summary.neglectedGoals.length}</div>
            <div class="stat-desc">Require Focus</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Per-Goal Breakdown -->
  <div class="mb-6">
    <h2 class="text-2xl font-bold mb-6">Goal-by-Goal Breakdown</h2>
    
    <div class="space-y-6">
      <!-- Aligned Goals -->
      {#each summary.alignedGoals as goal}
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-xl font-semibold text-success">{goal.goalTitle}</h3>
              <div class="badge badge-success">
                {goal.points} point{goal.points !== 1 ? 's' : ''}
              </div>
            </div>
            
            {#if goal.evidence && goal.evidence.length > 0}
              <div class="space-y-2">
                <ul class="list-disc list-inside space-y-2">
                  {#each goal.evidence as evidence}
                    <li class="text-base-content/80">"{evidence}"</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        </div>
      {/each}
      
      <!-- Neglected Goals -->
      {#each summary.neglectedGoals as goal}
        <div class="card bg-base-100 border-base-300 border shadow-xl">
          <div class="card-body">
            <div class="flex justify-between items-start mb-4">
              <h3 class="text-xl font-semibold text-warning">{goal.goalTitle}</h3>
              <div class="badge badge-ghost">
                0 points
              </div>
            </div>
            
            <p class="text-base-content/70 italic">
              {goal.reason || "No activity noted this week. You might revisit whether this goal is still important, or if a small step could make it easier to engage."}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Analysis Summary -->
  <div class="card bg-base-100 border-base-300 mb-6 border shadow-xl">
    <div class="card-body">
      <h2 class="card-title mb-4">
        <ListIcon size={24} />
        Analysis Summary
      </h2>
      <div class="prose max-w-none">
        <Markdown content={summary.summary} />
      </div>
    </div>
  </div>

  <!-- For Next Week -->
  {#if summary.suggestedNextSteps && summary.suggestedNextSteps.length > 0}
    <div class="card bg-base-100 border-base-300 mb-6 border shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">
          <ArrowRightIcon size={24} />
          For Next Week
        </h2>
        <div class="space-y-3">
          {#each summary.suggestedNextSteps as step, index}
            <div class="flex items-start gap-3">
              <div class="badge badge-primary badge-sm mt-1">{index + 1}</div>
              <p class="text-base-content/80">{step}</p>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Metadata -->
  <div class="card bg-base-200">
    <div class="card-body p-4">
      <div class="flex items-center justify-between text-sm">
        <div class="text-base-content/60 flex items-center gap-2">
          <ClockIcon size={14} />
          Generated {formatDateTime(summary.createdAt)}
        </div>
        {#if summary.updatedAt !== summary.createdAt}
          <div class="text-base-content/60">
            Updated {formatDateTime(summary.updatedAt)}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="mb-4 text-lg font-bold">Delete Goal Alignment Analysis</h3>
      <p class="mb-6">Are you sure you want to permanently delete this goal alignment analysis? This action cannot be undone.</p>
      <div class="modal-action">
        <button on:click={() => (showDeleteModal = false)} class="btn btn-ghost" disabled={deleting}> Cancel </button>
        <button on:click={deleteSummary} class="btn btn-error gap-2" disabled={deleting}>
          {#if deleting}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            <TrashIcon size={16} />
          {/if}
          Delete Analysis
        </button>
      </div>
    </div>
  </div>
{/if}
