<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { measurementsApi } from '$lib/api/measurements';
  import type { MeasurementResponse, UpdateMeasurementRequest } from '$lib/types/measurements';
  import { Ruler, Save, Calculator, ArrowLeft } from 'lucide-svelte';

  // Reactive state
  let measurement: MeasurementResponse | null = $state(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Form state - initialized when measurement is loaded
  let recordedDate = $state('');
  let weightLbs = $state<number | undefined>(undefined);
  let neckCm = $state<number | undefined>(undefined);
  let waistAtNavelCm = $state<number | undefined>(undefined);
  let waistAboveNavelCm = $state<number | undefined>(undefined);
  let waistBelowNavelCm = $state<number | undefined>(undefined);
  let hipCm = $state<number | undefined>(undefined);
  let notes = $state('');

  // UI state
  let saving = $state(false);

  // Get measurement ID from URL params
  let measurementId = $derived($page.params.id);

  // Form validation
  let recordedDateTouched = $state(false);
  let isValid = $derived(recordedDate.trim().length > 0);

  // Computed values
  let averageWaist = $derived(() => {
    const measurements = [waistAtNavelCm, waistAboveNavelCm, waistBelowNavelCm].filter((m) => m !== undefined && m !== null);
    if (measurements.length === 0) return undefined;
    return measurements.reduce((sum, m) => sum + m!, 0) / measurements.length;
  });

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
        // Initialize form fields
        recordedDate = result.recordedDate;
        weightLbs = result.weightLbs ?? undefined;
        neckCm = result.neckCm ?? undefined;
        waistAtNavelCm = result.waistAtNavelCm ?? undefined;
        waistAboveNavelCm = result.waistAboveNavelCm ?? undefined;
        waistBelowNavelCm = result.waistBelowNavelCm ?? undefined;
        hipCm = result.hipCm ?? undefined;
        notes = result.notes ?? '';
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

  // Form submission
  async function handleSubmit() {
    recordedDateTouched = true;

    if (!isValid) {
      error = 'Please fix the validation errors before submitting.';
      return;
    }

    if (!measurement) {
      error = 'Measurement not found';
      return;
    }

    // Check if at least one measurement is provided
    const hasAnyMeasurement = weightLbs || neckCm || waistAtNavelCm || waistAboveNavelCm || waistBelowNavelCm || hipCm;
    if (!hasAnyMeasurement) {
      error = 'Please provide at least one measurement.';
      return;
    }

    try {
      saving = true;
      error = null;

      const updateData: UpdateMeasurementRequest = {
        recordedDate,
        weightLbs,
        neckCm,
        waistAtNavelCm,
        waistAboveNavelCm,
        waistBelowNavelCm,
        hipCm,
        notes: notes.trim() || undefined,
      };

      await measurementsApi.updateMeasurement(measurement.id, updateData);

      // Redirect to measurement detail page on success
      goto(`/measurements/${measurement.id}`);
    } catch (err) {
      console.error('Failed to update measurement:', err);
      error = err instanceof Error ? err.message : 'Failed to update measurement';
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    if (measurement) {
      goto(`/measurements/${measurement.id}`);
    } else {
      goto('/measurements');
    }
  }

  // Helper functions to convert units
  function cmToInches(cm: number): string {
    return (cm / 2.54).toFixed(1);
  }

  function lbsToKg(lbs: number): string {
    return (lbs / 2.205).toFixed(1);
  }
</script>

<svelte:head>
  <title>{measurement ? `Edit Measurement - ${measurement.recordedDate}` : 'Edit Measurement'} - Gamified Life</title>
  <meta name="description" content="Edit body measurement information" />
</svelte:head>

<div class="bg-base-200 min-h-screen pb-12">
  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center py-20">
      <div class="space-y-4 text-center">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-base-content/60">Loading measurement...</p>
      </div>
    </div>
  {:else if error && !measurement}
    <!-- Error State -->
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="space-y-6">
        <div class="flex items-center gap-4">
          <button onclick={() => goto('/measurements')} class="btn btn-ghost btn-sm gap-2">
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
    </div>
  {:else if measurement}
    <!-- Page Header -->
    <div class="from-primary/10 to-secondary/10 border-primary/20 border-b bg-gradient-to-br">
      <div class="mx-auto max-w-4xl px-4 py-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content w-16 rounded-full">
                <Ruler size={32} />
              </div>
            </div>
            <div>
              <h1 class="text-primary text-3xl font-bold">Edit Measurement</h1>
              <p class="text-base-content/70">Update your body measurements</p>
            </div>
          </div>
          <button onclick={handleCancel} class="btn btn-ghost btn-sm gap-2">
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Form Section (2/3 width) -->
        <div class="lg:col-span-2">
          <div class="card bg-base-100 border-base-300 border shadow-xl">
            <div class="card-body p-4 sm:p-6 lg:p-8">
              <form onsubmit={handleSubmit} class="space-y-6">
                <!-- Date Field -->
                <div class="form-control">
                  <label class="label" for="recordedDate">
                    <span class="label-text text-base font-medium">Date</span>
                  </label>
                  <input
                    id="recordedDate"
                    type="date"
                    bind:value={recordedDate}
                    onblur={() => (recordedDateTouched = true)}
                    class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02] {recordedDateTouched && !isValid
                      ? 'input-error'
                      : ''}"
                    required
                  />
                  {#if recordedDateTouched && !isValid}
                    <div class="label">
                      <span class="label-text-alt text-error">Date is required</span>
                    </div>
                  {/if}
                </div>

                <!-- Weight Field -->
                <div class="form-control">
                  <label class="label" for="weight">
                    <span class="label-text text-base font-medium">Weight (lbs)</span>
                  </label>
                  <input
                    id="weight"
                    type="number"
                    bind:value={weightLbs}
                    class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                    placeholder="150"
                    min="1"
                    max="1000"
                    step="0.1"
                  />
                  {#if weightLbs}
                    <div class="label">
                      <span class="label-text-alt">≈ {lbsToKg(weightLbs)} kg</span>
                    </div>
                  {/if}
                </div>

                <!-- Neck Field -->
                <div class="form-control">
                  <label class="label" for="neck">
                    <span class="label-text text-base font-medium">Neck (cm)</span>
                  </label>
                  <input
                    id="neck"
                    type="number"
                    bind:value={neckCm}
                    class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                    placeholder="38"
                    min="1"
                    max="100"
                    step="0.1"
                  />
                  {#if neckCm}
                    <div class="label">
                      <span class="label-text-alt">≈ {cmToInches(neckCm)} inches</span>
                    </div>
                  {/if}
                </div>

                <!-- Waist Measurements Section -->
                <div class="space-y-4">
                  <h3 class="text-lg font-medium text-base-content">Waist Measurements (cm)</h3>
                  <div class="bg-base-200 rounded-lg p-4 space-y-4">
                    <!-- Waist at Navel -->
                    <div class="form-control">
                      <label class="label" for="waist-navel">
                        <span class="label-text font-medium">At Navel</span>
                      </label>
                      <input
                        id="waist-navel"
                        type="number"
                        bind:value={waistAtNavelCm}
                        class="input input-bordered focus:input-primary w-full transition-all duration-200"
                        placeholder="85"
                        min="1"
                        max="200"
                        step="0.1"
                      />
                      {#if waistAtNavelCm}
                        <div class="label">
                          <span class="label-text-alt">≈ {cmToInches(waistAtNavelCm)} inches</span>
                        </div>
                      {/if}
                    </div>

                    <!-- Waist above Navel -->
                    <div class="form-control">
                      <label class="label" for="waist-above">
                        <span class="label-text font-medium">Above Navel</span>
                      </label>
                      <input
                        id="waist-above"
                        type="number"
                        bind:value={waistAboveNavelCm}
                        class="input input-bordered focus:input-primary w-full transition-all duration-200"
                        placeholder="83"
                        min="1"
                        max="200"
                        step="0.1"
                      />
                      {#if waistAboveNavelCm}
                        <div class="label">
                          <span class="label-text-alt">≈ {cmToInches(waistAboveNavelCm)} inches</span>
                        </div>
                      {/if}
                    </div>

                    <!-- Waist below Navel -->
                    <div class="form-control">
                      <label class="label" for="waist-below">
                        <span class="label-text font-medium">Below Navel</span>
                      </label>
                      <input
                        id="waist-below"
                        type="number"
                        bind:value={waistBelowNavelCm}
                        class="input input-bordered focus:input-primary w-full transition-all duration-200"
                        placeholder="87"
                        min="1"
                        max="200"
                        step="0.1"
                      />
                      {#if waistBelowNavelCm}
                        <div class="label">
                          <span class="label-text-alt">≈ {cmToInches(waistBelowNavelCm)} inches</span>
                        </div>
                      {/if}
                    </div>

                    <!-- Average Display -->
                    {#if averageWaist()}
                      <div class="bg-primary/10 border-primary/20 border rounded-lg p-3 mt-4">
                        <div class="flex items-center gap-2">
                          <Calculator size={16} class="text-primary" />
                          <span class="font-medium text-primary">Average Waist: {averageWaist()?.toFixed(1)} cm</span>
                          <span class="text-sm text-base-content/60">(≈ {cmToInches(averageWaist()!)} inches)</span>
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- Hip Field -->
                <div class="form-control">
                  <label class="label" for="hip">
                    <span class="label-text text-base font-medium">Hip (cm)</span>
                    <span class="label-text-alt">Optional - needed for female body fat calculation</span>
                  </label>
                  <input
                    id="hip"
                    type="number"
                    bind:value={hipCm}
                    class="input input-bordered input-lg focus:input-primary w-full transition-all duration-200 focus:scale-[1.02]"
                    placeholder="95"
                    min="1"
                    max="200"
                    step="0.1"
                  />
                  {#if hipCm}
                    <div class="label">
                      <span class="label-text-alt">≈ {cmToInches(hipCm)} inches</span>
                    </div>
                  {/if}
                </div>

                <!-- Notes Field -->
                <div class="form-control">
                  <label class="label" for="notes">
                    <span class="label-text text-base font-medium">Notes</span>
                    <span class="label-text-alt">Optional</span>
                  </label>
                  <textarea
                    id="notes"
                    bind:value={notes}
                    class="textarea textarea-bordered textarea-lg focus:textarea-primary h-24 w-full resize-none transition-all duration-200 focus:scale-[1.02]"
                    placeholder="Add any notes about your measurements or workout routine..."
                    maxlength="1000"
                  ></textarea>
                  {#if notes.length > 0}
                    <div class="label">
                      <span class="label-text-alt">{notes.length}/1000 characters</span>
                    </div>
                  {/if}
                </div>

                <!-- Error Display -->
                {#if error}
                  <div class="alert alert-error">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>{error}</span>
                  </div>
                {/if}

                <!-- Action Buttons -->
                <div class="flex gap-4 pt-4">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg flex-1 gap-2 shadow-lg transition-all duration-200 hover:scale-105"
                    disabled={saving || !isValid}
                  >
                    {#if saving}
                      <span class="loading loading-spinner loading-sm"></span>
                      Saving...
                    {:else}
                      <Save size={20} />
                      Save Changes
                    {/if}
                  </button>
                  <button type="button" onclick={handleCancel} class="btn btn-outline btn-lg transition-all duration-200 hover:scale-105" disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Tips Sidebar (1/3 width) -->
        <div class="lg:col-span-1">
          <div class="sticky top-8 space-y-6">
            <!-- Original Values Card -->
            <div class="card from-info/10 to-primary/10 border-info/20 border bg-gradient-to-br">
              <div class="card-body p-6">
                <h3 class="text-info mb-4 font-semibold">Original Values</h3>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span>Date:</span>
                    <span class="font-mono">{measurement.recordedDate}</span>
                  </div>
                  {#if measurement.weightLbs}
                    <div class="flex justify-between">
                      <span>Weight:</span>
                      <span class="font-mono">{measurement.weightLbs.toFixed(1)} lbs</span>
                    </div>
                  {/if}
                  {#if measurement.waistCm}
                    <div class="flex justify-between">
                      <span>Waist:</span>
                      <span class="font-mono">{measurement.waistCm.toFixed(1)} cm</span>
                    </div>
                  {/if}
                  {#if measurement.bodyFatPercentage}
                    <div class="flex justify-between">
                      <span>Body Fat:</span>
                      <span class="font-mono">{measurement.bodyFatPercentage.toFixed(1)}%</span>
                    </div>
                  {/if}
                </div>
              </div>
            </div>

            <!-- Measurement Tips Card -->
            <div class="card from-primary/10 to-secondary/10 border-primary/20 border bg-gradient-to-br shadow-xl">
              <div class="card-body p-6">
                <h3 class="card-title text-primary mb-4 flex items-center gap-2 text-xl">📏 Measurement Tips</h3>
                <div class="space-y-4 text-sm">
                  <div>
                    <h4 class="text-primary font-medium">Consistency is Key</h4>
                    <p class="text-base-content/70">Take measurements at the same time of day, preferably in the morning</p>
                  </div>
                  <div>
                    <h4 class="text-primary font-medium">Proper Posture</h4>
                    <p class="text-base-content/70">Stand upright with relaxed shoulders and breathe normally</p>
                  </div>
                  <div>
                    <h4 class="text-primary font-medium">Multiple Waist Points</h4>
                    <p class="text-base-content/70">Take 2-3 waist measurements for a more accurate average</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Units Card -->
            <div class="card from-accent/10 to-primary/10 border-accent/20 border bg-gradient-to-br">
              <div class="card-body p-6">
                <h3 class="card-title text-accent mb-4 flex items-center gap-2 text-xl">📐 Unit Conversions</h3>
                <div class="space-y-3 text-sm">
                  <div class="bg-base-200 rounded-lg p-3">
                    <div class="font-medium text-xs text-base-content/60 mb-1">Weight</div>
                    <div>1 lb = 0.45 kg</div>
                    <div>1 kg = 2.2 lbs</div>
                  </div>
                  <div class="bg-base-200 rounded-lg p-3">
                    <div class="font-medium text-xs text-base-content/60 mb-1">Length</div>
                    <div>1 cm = 0.39 inches</div>
                    <div>1 inch = 2.54 cm</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
