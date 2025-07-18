<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { CheckCircleIcon } from 'lucide-svelte';
  import JournalDayRating from './JournalDayRating.svelte';

  export let open = false;
  
  let dayRating: number | null = null;

  const dispatch = createEventDispatcher<{
    finish: { dayRating: number | null };
    cancel: void;
  }>();

  function handleFinish() {
    dispatch('finish', { dayRating });
    resetAndClose();
  }

  function handleCancel() {
    dispatch('cancel');
    resetAndClose();
  }

  function resetAndClose() {
    dayRating = null;
    open = false;
  }

  function handleRatingChange(event: CustomEvent<number>) {
    dayRating = event.detail;
  }
</script>

{#if open}
<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="mb-6 text-lg font-bold">Complete Your Journal</h3>
    
    <div class="mb-6">
      <p class="mb-4 text-base-content/80">Before finishing your journal, how would you rate your day?</p>
      <JournalDayRating dayRating={dayRating} on:ratingChange={handleRatingChange} />
    </div>
    
    <div class="text-sm text-base-content/70">
      <p>
        Rating is optional. If you don't rate your day, we'll try to estimate a rating based on
        the content of your journal.
      </p>
    </div>
    
    <div class="modal-action">
      <button class="btn btn-ghost" on:click={handleCancel} data-test-id="cancel-finish-button">
        Cancel
      </button>
      <button 
        class="btn btn-success" 
        on:click={handleFinish}
        data-test-id="confirm-finish-button"
      >
        <CheckCircleIcon size={16} />
        Finish Journal
      </button>
    </div>
  </div>
</div>
{/if}
