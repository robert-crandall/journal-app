<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { measurementsApi } from '$lib/api/measurements';
  import { PhotoService } from '$lib/api/photos';
  import type { MeasurementResponse } from '$lib/types/measurements';
  import type { PhotoResponse } from '$lib/types/photos';
  import { Plus, Ruler, Edit3, Trash2, Eye, TrendingUp, Camera } from 'lucide-svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import PageContainer from '$lib/components/common/PageContainer.svelte';

  // Reactive state for measurements data
  let measurements: MeasurementResponse[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let measurementPhotos: Record<string, PhotoResponse[]> = $state({});

  // Pagination state
  let currentPage = $state(0);
  let itemsPerPage = $state(10);
  let totalCount = $state(0);

  // Load data on component mount
  onMount(async () => {
    await loadMeasurementsData();
  });

  // Separate function to load measurements data
  async function loadMeasurementsData() {
    try {
      loading = true;
      error = null;

      const result = await measurementsApi.getMeasurements({
        limit: itemsPerPage,
        offset: currentPage * itemsPerPage,
      });

      measurements = result.measurements;
      totalCount = result.total;

      // Load photos for each measurement
      await loadPhotosForMeasurements(measurements);
    } catch (err) {
      console.error('Failed to load measurements:', err);
      if (err instanceof Error && err.message === 'Authentication required') {
        goto('/login');
        return;
      }
      error = err instanceof Error ? err.message : 'Failed to load measurements';
    } finally {
      loading = false;
    }
  }

  // Load photos for multiple measurements
  async function loadPhotosForMeasurements(measurementsList: MeasurementResponse[]) {
    const photoPromises = measurementsList.map(async (measurement) => {
      try {
        const response = await PhotoService.listPhotos({
          linkedType: 'measurement',
          measurementId: measurement.id,
        });
        return { measurementId: measurement.id, photos: response.photos || [] };
      } catch (error) {
        console.error(`Failed to load photos for measurement ${measurement.id}:`, error);
        return { measurementId: measurement.id, photos: [] };
      }
    });

    const photoResults = await Promise.all(photoPromises);
    const photosMap: Record<string, PhotoResponse[]> = {};

    photoResults.forEach(({ measurementId, photos }) => {
      photosMap[measurementId] = photos;
    });

    measurementPhotos = photosMap;
  }

  // Helper functions
  function formatWeight(weightLbs: number | null): string {
    if (!weightLbs) return 'N/A';
    return `${weightLbs.toFixed(1)} lbs`;
  }

  function formatMeasurement(cm: number | null): string {
    if (!cm) return 'N/A';
    return `${cm.toFixed(1)} cm`;
  }

  function formatBodyFat(percentage: number | null): string {
    if (!percentage) return 'N/A';
    return `${percentage.toFixed(1)}%`;
  }

  // Navigation functions
  function createMeasurement() {
    goto('/measurements/create');
  }

  function editMeasurement(id: string) {
    goto(`/measurements/${id}/edit`);
  }

  function viewMeasurementDetails(id: string) {
    goto(`/measurements/${id}`);
  }

  // Measurement actions
  async function deleteMeasurement(measurement: MeasurementResponse) {
    const date = measurement.recordedDate;
    if (!confirm(`Are you sure you want to delete the measurement from ${date}? This action cannot be undone.`)) {
      return;
    }

    try {
      await measurementsApi.deleteMeasurement(measurement.id);
      await loadMeasurementsData(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete measurement:', err);
      error = err instanceof Error ? err.message : 'Failed to delete measurement';
    }
  }

  // Pagination
  async function changePage(newPage: number) {
    currentPage = newPage;
    await loadMeasurementsData();
  }

  let totalPages = $derived(Math.ceil(totalCount / itemsPerPage));
</script>

<svelte:head>
  <title>Measurements - Gamified Life</title>
  <meta name="description" content="Track your body measurements and monitor your fitness progress over time" />
</svelte:head>

<div class="bg-base-200 min-h-screen">
  <PageContainer>
    <AppHeader title="Measurements" subtitle="Track your body metrics and fitness progress" icon={Ruler} />

    {#if loading}
      <!-- Loading State -->
      <div class="flex items-center justify-center py-20">
        <div class="space-y-4 text-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <p class="text-base-content/60">Loading your measurements...</p>
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
      <!-- Measurements Grid Layout -->
      <div class="grid gap-8 lg:grid-cols-4">
        <!-- Main Measurements Content (3/4 width) -->
        <div class="space-y-8 lg:col-span-3">
          <!-- Measurements Section -->
          {#if measurements.length > 0}
            <section>
              <h2 class="text-primary border-primary/20 mb-6 border-b pb-2 text-2xl font-semibold">Recent Measurements</h2>
              <div class="space-y-4">
                {#each measurements as measurement (measurement.id)}
                  <div class="card bg-base-100 border-base-300 border shadow-xl transition-all duration-200 hover:shadow-2xl">
                    <div class="card-body p-6">
                      <div class="mb-4 flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          <div class="text-2xl">📏</div>
                          <div class="flex-1">
                            <h3 class="text-lg font-bold">
                              {measurement.recordedDate}
                            </h3>
                            <p class="text-base-content/60 text-sm">
                              Recorded on {measurement.recordedDate}
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Measurement Data Grid -->
                      <div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <!-- Weight -->
                        <div class="bg-base-200 rounded-lg p-3 text-center">
                          <p class="text-base-content/60 mb-1 text-xs">Weight</p>
                          <p class="font-semibold">{formatWeight(measurement.weightLbs)}</p>
                        </div>

                        <!-- Waist -->
                        <div class="bg-base-200 rounded-lg p-3 text-center">
                          <p class="text-base-content/60 mb-1 text-xs">Waist (Avg)</p>
                          <p class="font-semibold">{formatMeasurement(measurement.waistCm)}</p>
                        </div>

                        <!-- Neck -->
                        <div class="bg-base-200 rounded-lg p-3 text-center">
                          <p class="text-base-content/60 mb-1 text-xs">Neck</p>
                          <p class="font-semibold">{formatMeasurement(measurement.neckCm)}</p>
                        </div>

                        <!-- Body Fat -->
                        <div class="bg-base-200 rounded-lg p-3 text-center">
                          <p class="text-base-content/60 mb-1 text-xs">Body Fat</p>
                          <p class="font-semibold">{formatBodyFat(measurement.bodyFatPercentage)}</p>
                        </div>
                      </div>

                      <!-- Additional measurements if available -->
                      {#if measurement.hipCm || measurement.waistAtNavelCm || measurement.waistAboveNavelCm || measurement.waistBelowNavelCm}
                        <div class="mb-4">
                          <p class="text-base-content/80 mb-2 text-sm font-medium">Additional Measurements:</p>
                          <div class="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                            {#if measurement.hipCm}
                              <div class="bg-base-200 rounded px-2 py-1">
                                <span class="text-base-content/60">Hip:</span>
                                {formatMeasurement(measurement.hipCm)}
                              </div>
                            {/if}
                            {#if measurement.waistAtNavelCm}
                              <div class="bg-base-200 rounded px-2 py-1">
                                <span class="text-base-content/60">Waist @ Navel:</span>
                                {formatMeasurement(measurement.waistAtNavelCm)}
                              </div>
                            {/if}
                            {#if measurement.waistAboveNavelCm}
                              <div class="bg-base-200 rounded px-2 py-1">
                                <span class="text-base-content/60">Waist Above:</span>
                                {formatMeasurement(measurement.waistAboveNavelCm)}
                              </div>
                            {/if}
                            {#if measurement.waistBelowNavelCm}
                              <div class="bg-base-200 rounded px-2 py-1">
                                <span class="text-base-content/60">Waist Below:</span>
                                {formatMeasurement(measurement.waistBelowNavelCm)}
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <!-- Notes -->
                      {#if measurement.notes}
                        <div class="mb-4">
                          <p class="text-base-content/80 mb-1 text-sm font-medium">Notes:</p>
                          <p class="text-base-content/70 bg-base-200 rounded p-2 text-sm">{measurement.notes}</p>
                        </div>
                      {/if}

                      <!-- Photos Preview -->
                      {#if measurementPhotos[measurement.id] && measurementPhotos[measurement.id].length > 0}
                        <div class="mb-4">
                          <p class="text-base-content/80 mb-2 flex items-center gap-1 text-sm font-medium">
                            <Camera size={14} />
                            Photos ({measurementPhotos[measurement.id].length})
                          </p>
                          <div class="flex gap-2 overflow-x-auto pb-2">
                            {#each measurementPhotos[measurement.id].slice(0, 4) as photo}
                              <a
                                href={PhotoService.getPhotoUrl(photo.id)}
                                target="_blank"
                                class="block h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-opacity hover:opacity-80"
                              >
                                <img src={PhotoService.getThumbnailUrl(photo.id)} alt="Measurement photo" class="h-full w-full object-cover" />
                              </a>
                            {/each}
                            {#if measurementPhotos[measurement.id].length > 4}
                              <div class="bg-base-300 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg">
                                <span class="text-base-content/60 text-xs">+{measurementPhotos[measurement.id].length - 4}</span>
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <!-- Action Buttons -->
                      <div class="flex flex-wrap gap-2">
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => viewMeasurementDetails(measurement.id)}>
                          <Eye size={14} />
                          View
                        </button>
                        <button class="btn btn-ghost btn-sm gap-1" onclick={() => editMeasurement(measurement.id)}>
                          <Edit3 size={14} />
                          Edit
                        </button>
                        <button
                          class="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content gap-1"
                          onclick={() => deleteMeasurement(measurement)}
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>

              <!-- Pagination -->
              {#if totalPages > 1}
                <div class="mt-8 flex justify-center">
                  <div class="join">
                    <button class="join-item btn btn-sm" class:btn-disabled={currentPage === 0} onclick={() => changePage(currentPage - 1)}> Previous </button>
                    {#each Array(totalPages).fill(0) as _, i}
                      <button class="join-item btn btn-sm" class:btn-active={i === currentPage} onclick={() => changePage(i)}>
                        {i + 1}
                      </button>
                    {/each}
                    <button class="join-item btn btn-sm" class:btn-disabled={currentPage === totalPages - 1} onclick={() => changePage(currentPage + 1)}>
                      Next
                    </button>
                  </div>
                </div>
              {/if}
            </section>
          {:else}
            <!-- Empty State -->
            <section>
              <div class="card bg-base-100 border-base-300 border shadow-xl">
                <div class="card-body py-12 text-center">
                  <div class="avatar placeholder mb-6">
                    <div class="bg-base-300 text-base-content w-20 rounded-full">
                      <Ruler size={40} />
                    </div>
                  </div>
                  <h3 class="mb-2 text-xl font-semibold">No Measurements Yet</h3>
                  <p class="text-base-content/60 mb-6">Start tracking your body measurements to monitor your fitness progress over time.</p>
                  <button onclick={createMeasurement} class="btn btn-primary btn-lg gap-2">
                    <Plus size={20} />
                    Record Your First Measurement
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
                    <span class="text-sm">Total Entries:</span>
                    <span class="font-medium">{totalCount}</span>
                  </div>
                  {#if measurements.length > 0}
                    <div class="flex justify-between">
                      <span class="text-sm">Latest Weight:</span>
                      <span class="font-medium">{formatWeight(measurements[0]?.weightLbs)}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-sm">Latest Body Fat:</span>
                      <span class="font-medium">{formatBodyFat(measurements[0]?.bodyFatPercentage)}</span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Tips Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">💡 Tips</h3>
                <div class="space-y-3 text-sm">
                  <p class="text-base-content/70">Take measurements at the same time of day for consistency.</p>
                  <p class="text-base-content/70">Body fat percentage is calculated using the U.S. Navy method.</p>
                  <p class="text-base-content/70">Track multiple waist measurements for more accurate averages.</p>
                </div>
              </div>
            </div>

            <!-- Actions Card -->
            <div class="card bg-base-100 border-base-300 border shadow-xl">
              <div class="card-body p-6">
                <h3 class="mb-4 font-semibold">Actions</h3>
                <div class="space-y-3">
                  <button onclick={createMeasurement} class="btn btn-primary w-full gap-2">
                    <Plus size={16} />
                    New Measurement
                  </button>
                  <button onclick={() => goto('/measurements/chart')} class="btn btn-secondary w-full gap-2">
                    <TrendingUp size={16} />
                    View Charts
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </PageContainer>
</div>
