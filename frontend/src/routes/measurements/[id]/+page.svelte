<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { measurementsApi } from '$lib/api/measurements';
  import type { MeasurementResponse } from '$lib/types/measurements';
  import { Ruler, Edit3, Trash2, ArrowLeft, Calculator, Calendar } from 'lucide-svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import PageContainer from '$lib/components/common/PageContainer.svelte';
  import { formatDateTime } from '$lib/utils/date'

  // Reactive state
  let measurement: MeasurementResponse | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Get measurement ID from URL params
  let measurementId = $derived($page.params.id);

  // Load data on component mount
  onMount(async () => {
    await loadMeasurement();
  });

  async function loadMeasurement() {
    if (!measurementId) {
      error = 'Measurement ID not found';
      loading = false;
      return;
    }

    try {
      loading = true;
      error = null;

      const result = await measurementsApi.getMeasurement(measurementId);
      if (!result) {
        error = 'Measurement not found';
      } else {
        measurement = result;
      }
    } catch (err) {
      console.error('Failed to load measurement:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load measurement';
    } finally {
      loading = false;
    }
  }

  // Helper functions
  function formatWeight(weightLbs: number | null): string {
    if (!weightLbs) return 'Not recorded';
    return `${weightLbs.toFixed(1)} lbs (${(weightLbs / 2.205).toFixed(1)} kg)`;
  }

  function formatMeasurement(cm: number | null): string {
    if (!cm) return 'Not recorded';
    return `${cm.toFixed(1)} cm (${(cm / 2.54).toFixed(1)} inches)`;
  }

  function formatBodyFat(percentage: number | null): string {
    if (!percentage) return 'Not calculated';
    return `${percentage.toFixed(1)}%`;
  }

  // Navigation functions
  function goBack() {
    goto('/measurements');
  }

  function editMeasurement() {
    if (measurement) {
      goto(`/measurements/${measurement.id}/edit`);
    }
  }

  // Measurement actions
  async function deleteMeasurement() {
    if (!measurement) return;

    const date = measurement.recordedDate;
    if (!confirm(`Are you sure you want to delete the measurement from ${date}? This action cannot be undone.`)) {
      return;
    }

    try {
      await measurementsApi.deleteMeasurement(measurement.id);
      goto('/measurements');
    } catch (err) {
      console.error('Failed to delete measurement:', err);
      error = err instanceof Error ? err.message : 'Failed to delete measurement';
    }
  }
</script>

<svelte:head>
  <title>{measurement ? `Measurement - ${measurement.recordedDate}` : 'Measurement'} - Gamified Life</title>
  <meta name="description" content="View detailed body measurement information" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <PageContainer>
    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading measurement...</p>
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <button onclick={goBack} class="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={16} />
            Back to Measurements
          </button>
        </div>
        <div class="alert alert-error mx-auto max-w-md">
          <div class="flex items-center gap-3">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      </div>
    {:else if measurement}
      <!-- Measurement Details -->
      <div class="space-y-8">
        <!-- Header with Back Button -->
        <div class="flex items-center justify-between">
          <button onclick={goBack} class="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={16} />
            Back to Measurements
          </button>
          <div class="flex gap-2">
            <button onclick={editMeasurement} class="btn btn-primary btn-sm gap-2">
              <Edit3 size={16} />
              Edit
            </button>
            <button onclick={deleteMeasurement} class="btn btn-error btn-sm gap-2">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid gap-8 lg:grid-cols-3">
          <!-- Main Details (2/3 width) -->
          <div class="space-y-6 lg:col-span-2">
            <!-- Header Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <div class="flex items-center gap-4">
                  <div class="avatar placeholder">
                    <div class="bg-primary text-primary-content w-16 rounded-full">
                      <Ruler size={32} />
                    </div>
                  </div>
                  <div>
                    <h1 class="text-3xl font-bold">
                      Measurement - {measurement.recordedDate}
                    </h1>
                    <p class="text-base-content/70 flex items-center gap-2">
                      <Calendar size={16} />
                      Recorded on {measurement.recordedDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Core Measurements Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h2 class="card-title text-xl mb-6">Core Measurements</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Weight -->
                  <div class="bg-base-200 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-2xl">⚖️</span>
                      <h3 class="font-semibold">Weight</h3>
                    </div>
                    <p class="text-lg font-mono">{formatWeight(measurement.weightLbs)}</p>
                  </div>

                  <!-- Neck -->
                  <div class="bg-base-200 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-2xl">🦢</span>
                      <h3 class="font-semibold">Neck</h3>
                    </div>
                    <p class="text-lg font-mono">{formatMeasurement(measurement.neckCm)}</p>
                  </div>

                  <!-- Average Waist -->
                  <div class="bg-base-200 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <Calculator size={20} />
                      <h3 class="font-semibold">Waist (Average)</h3>
                    </div>
                    <p class="text-lg font-mono">{formatMeasurement(measurement.waistCm)}</p>
                  </div>

                  <!-- Body Fat -->
                  <div class="bg-base-200 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-2xl">📊</span>
                      <h3 class="font-semibold">Body Fat %</h3>
                    </div>
                    <p class="text-lg font-mono">{formatBodyFat(measurement.bodyFatPercentage)}</p>
                    {#if !measurement.bodyFatPercentage}
                      <p class="text-xs text-base-content/60 mt-1">
                        Update your profile with height and sex for calculation
                      </p>
                    {/if}
                  </div>
                </div>
              </div>
            </div>

            <!-- Detailed Waist Measurements (if available) -->
            {#if measurement.waistAtNavelCm || measurement.waistAboveNavelCm || measurement.waistBelowNavelCm || measurement.hipCm}
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h2 class="card-title text-xl mb-6">Detailed Measurements</h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Individual Waist Measurements -->
                    {#if measurement.waistAtNavelCm}
                      <div class="bg-base-200 rounded-lg p-4">
                        <h3 class="font-medium text-sm text-base-content/80 mb-1">Waist at Navel</h3>
                        <p class="text-lg font-mono">{formatMeasurement(measurement.waistAtNavelCm)}</p>
                      </div>
                    {/if}
                    
                    {#if measurement.waistAboveNavelCm}
                      <div class="bg-base-200 rounded-lg p-4">
                        <h3 class="font-medium text-sm text-base-content/80 mb-1">Waist Above Navel</h3>
                        <p class="text-lg font-mono">{formatMeasurement(measurement.waistAboveNavelCm)}</p>
                      </div>
                    {/if}
                    
                    {#if measurement.waistBelowNavelCm}
                      <div class="bg-base-200 rounded-lg p-4">
                        <h3 class="font-medium text-sm text-base-content/80 mb-1">Waist Below Navel</h3>
                        <p class="text-lg font-mono">{formatMeasurement(measurement.waistBelowNavelCm)}</p>
                      </div>
                    {/if}
                    
                    {#if measurement.hipCm}
                      <div class="bg-base-200 rounded-lg p-4">
                        <h3 class="font-medium text-sm text-base-content/80 mb-1">Hip</h3>
                        <p class="text-lg font-mono">{formatMeasurement(measurement.hipCm)}</p>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            {/if}

            <!-- Notes (if available) -->
            {#if measurement.notes}
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h2 class="card-title text-xl mb-4">Notes</h2>
                  <div class="bg-base-200 rounded-lg p-4">
                    <p class="whitespace-pre-wrap">{measurement.notes}</p>
                  </div>
                </div>
              </div>
            {/if}

            <!-- Extra Measurements (if available) -->
            {#if measurement.extra && Object.keys(measurement.extra).length > 0}
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h2 class="card-title text-xl mb-4">Additional Measurements</h2>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {#each Object.entries(measurement.extra) as [key, value]}
                      <div class="bg-base-200 rounded-lg p-4">
                        <h3 class="font-medium text-sm text-base-content/80 mb-1 capitalize">
                          {key.replace(/_/g, ' ')}
                        </h3>
                        <p class="text-lg font-mono">{value.toFixed(1)} cm</p>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}
          </div>

          <!-- Sidebar (1/3 width) -->
          <div class="lg:col-span-1">
            <div class="sticky top-8 space-y-6">
              <!-- Quick Actions Card -->
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body p-6">
                  <h3 class="card-title text-lg mb-4">Quick Actions</h3>
                  <div class="space-y-3">
                    <button onclick={editMeasurement} class="btn btn-primary w-full gap-2">
                      <Edit3 size={16} />
                      Edit Measurement
                    </button>
                    <button onclick={() => goto('/measurements/create')} class="btn btn-secondary w-full gap-2">
                      <Ruler size={16} />
                      New Measurement
                    </button>
                    <button onclick={deleteMeasurement} class="btn btn-error btn-outline w-full gap-2">
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <!-- Measurement Info Card -->
              <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br">
                <div class="card-body p-6">
                  <h3 class="text-primary mb-4 font-semibold">Measurement Info</h3>
                  <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                      <span>Recorded:</span>
                      <span class="font-medium">{measurement.recordedDate}</span>
                    </div>
                    <div class="flex justify-between">
                      <span>Created:</span>
                      <span class="font-medium">{formatDateTime(measurement.createdAt, 'date-only')}</span>
                    </div>
                    {#if measurement.updatedAt !== measurement.createdAt}
                      <div class="flex justify-between">
                        <span>Updated:</span>
                        <span class="font-medium">{formatDateTime(measurement.updatedAt, 'date-only')}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Body Fat Info (if calculated) -->
              {#if measurement.bodyFatPercentage}
                <div class="card from-accent/10 to-primary/10 border-accent/20 border bg-gradient-to-br">
                  <div class="card-body p-6">
                    <h3 class="text-accent mb-4 font-semibold">Body Fat Analysis</h3>
                    <div class="space-y-3 text-sm">
                      <div class="text-center">
                        <div class="text-2xl font-bold text-accent">{formatBodyFat(measurement.bodyFatPercentage)}</div>
                      </div>
                      <div class="text-center">
                        <p class="text-xs text-base-content/60">
                          Calculated using U.S. Navy method
                        </p>
                      </div>
                      <div class="bg-base-200 rounded-lg p-3">
                        <p class="text-xs text-base-content/70">
                          This calculation uses your weight, waist, neck, and height measurements along with your biological sex.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </PageContainer>
</div>
