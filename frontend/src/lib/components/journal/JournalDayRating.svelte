<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { StarIcon } from 'lucide-svelte';

  export let dayRating: number | null = null;
  export let inferredDayRating: number | null = null;
  export let readonly = false;
  export let showEmoji = true;

  const dispatch = createEventDispatcher<{
    ratingChange: number;
  }>();

  const emojis = ['😞', '😐', '🙂', '😄', '🤩'];
  const ratingLabels = ['Very Bad', 'Bad', 'Okay', 'Good', 'Great'];

  function handleRatingSelect(rating: number) {
    if (!readonly) {
      dispatch('ratingChange', rating);
    }
  }

  $: displayRating = dayRating || inferredDayRating;
  $: isInferred = !dayRating && inferredDayRating;
</script>

<div class="card bg-base-100 border-base-300 border shadow-xl">
  <div class="card-body">
    <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
      <StarIcon size={24} class="text-warning" />
      <span>Day Rating</span>
      {#if isInferred}
        <span class="badge badge-sm badge-warning">Estimated</span>
      {/if}
    </h3>

    <div class="flex flex-col items-center justify-center gap-4">
      {#if showEmoji && displayRating}
        <div class="text-5xl">{emojis[displayRating - 1]}</div>
      {/if}
      
      <div class="flex w-full items-center justify-center gap-1">
        {#each [1, 2, 3, 4, 5] as rating}
          <button
            type="button"
            data-test-id="rating-button-{rating}"
            class="btn btn-{readonly ? 'ghost' : 'outline'} {displayRating === rating ? 'btn-warning' : ''}"
            disabled={readonly}
            on:click={() => handleRatingSelect(rating)}
            aria-label={ratingLabels[rating - 1]}
          >
            {rating}
          </button>
        {/each}
      </div>
      
      {#if displayRating}
        <div class="text-center text-sm" data-test-id="day-rating-label">
          {ratingLabels[displayRating - 1]} Day
        </div>
      {:else if !readonly}
        <div class="text-center text-sm text-base-content/60">
          How was your day overall?
        </div>
      {/if}
    </div>
  </div>
</div>
