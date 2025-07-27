<script lang="ts">
  import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import { formatDateTime } from '$lib/utils/date';
  import type { JournalResponse, ChatMessage } from '$lib/types/journal';
  import { MessageCircleIcon, SendIcon, CheckCircleIcon, UserIcon, BotIcon } from 'lucide-svelte';
  import Markdown from '$lib/components/common/Markdown.svelte';
  import JournalFinishDialog from './JournalFinishDialog.svelte';

  export let journal: JournalResponse;
  export let date: string;

  const dispatch = createEventDispatcher<{
    update: JournalResponse;
  }>();

  let newMessage = '';
  let sending = false;
  let finishing = false;
  let error: string | null = null;
  let chatContainer: HTMLDivElement;
  let showFinishDialog = false;

  // Scroll to bottom when new messages are added
  afterUpdate(() => {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  onMount(() => {
    // Scroll to bottom on initial load
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  async function sendMessage() {
    if (!newMessage.trim() || sending) return;

    const messageToSend = newMessage.trim();
    newMessage = '';

    try {
      sending = true;
      error = null;

      const updatedJournal = await JournalService.addChatMessage(date, {
        message: messageToSend,
      });

      dispatch('update', updatedJournal);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to send message';
      // Restore the message on error
      newMessage = messageToSend;
    } finally {
      sending = false;
    }
  }

  async function finishJournal(dayRating: number | null = null) {
    try {
      finishing = true;
      error = null;

      // First update the journal with day rating if provided
      if (dayRating !== null) {
        await JournalService.updateJournal(date, { dayRating });
      }

      // Then finish the journal
      const completedJournal = await JournalService.finishJournal(date);
      dispatch('update', completedJournal);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to finish journal';
    } finally {
      finishing = false;
    }
  }

  function openFinishDialog() {
    showFinishDialog = true;
  }

  function handleFinish(event: CustomEvent<{ dayRating: number | null }>) {
    finishJournal(event.detail.dayRating);
  }

  function handleKeydown(event: KeyboardEvent) {
    // Send on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function formatMessageTime(timestamp: string): string {
    try {
      return formatDateTime(timestamp, 'time-only');
    } catch {
      return '';
    }
  }

  $: chatSession = journal.chatSession || [];
  $: messageCount = chatSession.length;
</script>

<div class="card bg-base-100 border-base-300 flex h-full flex-col border shadow-xl">
  <div class="card-body flex flex-grow flex-col p-0">
    <!-- Header -->
    <div class="border-base-300 border-b p-2 sm:p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 sm:gap-3">
          <MessageCircleIcon size={16} class="text-primary sm:hidden" />
          <MessageCircleIcon size={20} class="text-primary hidden sm:block" />
          <div>
            <h2 class="text-base font-semibold sm:text-lg">Reflection Session</h2>
          </div>
        </div>
        <div class="text-base-content/70 text-xs sm:text-sm">
          {messageCount} messages
        </div>
      </div>
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="mx-3 mt-3 sm:mx-6 sm:mt-4">
        <div class="alert alert-error p-2 text-xs sm:p-4 sm:text-sm">
          <span>{error}</span>
        </div>
      </div>
    {/if}

    <!-- Chat Messages -->
    <div bind:this={chatContainer} class="flex-grow overflow-y-auto scroll-smooth p-2 sm:p-4">
      <div class="space-y-2 sm:space-y-3">
        {#each chatSession as message, i (message)}
          <div class="flex items-start gap-2 sm:gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full sm:h-8 sm:w-8 {message.role === 'user'
                  ? 'bg-primary text-primary-content'
                  : 'bg-secondary text-secondary-content'}"
              >
                {#if message.role === 'user'}
                  <UserIcon size={12} class="sm:hidden" />
                  <UserIcon size={16} class="hidden sm:block" />
                {:else}
                  <BotIcon size={12} class="sm:hidden" />
                  <BotIcon size={16} class="hidden sm:block" />
                {/if}
              </div>
            </div>

            <!-- Message Content -->
            <div class="max-w-[75%] flex-1 sm:max-w-md lg:max-w-lg {message.role === 'user' ? 'text-right' : ''}">
              <div class="rounded-lg px-3 py-2 sm:px-4 sm:py-3 {message.role === 'user' ? 'bg-primary' : 'bg-base-200'}">
                <Markdown content={message.content} classes="prose-sm leading-relaxed {message.role === 'user' ? 'text-primary-content' : 'text-base-content'}" />
              </div>

              {#if message.timestamp}
                <p class="text-2xs mt-0.5 opacity-60 sm:mt-1 sm:text-xs {message.role === 'user' ? 'text-right' : ''}">
                  {formatMessageTime(message.timestamp)}
                </p>
              {/if}
            </div>
          </div>
        {/each}

        <!-- Typing indicator when sending -->
        {#if sending}
          <div class="flex items-start gap-2 sm:gap-3">
            <div class="flex-shrink-0">
              <div class="bg-secondary text-secondary-content flex h-6 w-6 items-center justify-center rounded-full sm:h-8 sm:w-8">
                <BotIcon size={12} class="sm:hidden" />
                <BotIcon size={16} class="hidden sm:block" />
              </div>
            </div>
            <div class="flex-1">
              <div class="bg-base-200 rounded-lg px-3 py-2 sm:px-4 sm:py-3">
                <div class="flex items-center gap-1">
                  <span class="loading loading-dots loading-xs sm:loading-sm"></span>
                  <span class="text-xs opacity-60 sm:text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Message Input - Sticky to Bottom -->
    <div class="border-base-300 mt-auto border-t p-2 sm:p-4">
      <div class="flex items-end gap-2">
        <div class="flex-1">
          <textarea
            data-test-id="chat-input"
            bind:value={newMessage}
            on:keydown={handleKeydown}
            placeholder="Share thoughts or ask questions..."
            class="textarea textarea-bordered focus:border-primary w-full resize-none text-sm focus:outline-none sm:text-base"
            rows="1"
            disabled={sending}
          ></textarea>
          <div class="label hidden py-0 sm:block">
            <span class="label-text-alt text-2xs opacity-60 sm:text-xs">Enter to send, Shift+Enter for new line</span>
          </div>
        </div>

        <button
          data-test-id="send-message-button"
          on:click={sendMessage}
          disabled={!newMessage.trim() || sending}
          class="btn btn-primary btn-sm h-10 px-2 sm:px-3"
        >
          {#if sending}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            <SendIcon size={16} />
          {/if}
        </button>
      </div>

      <!-- Finish Button (Below Input) -->
      <div class="mt-2 flex justify-end sm:mt-3">
        <button
          data-test-id="finish-journal-button"
          on:click={openFinishDialog}
          disabled={finishing}
          class="btn btn-success btn-sm sm:btn-md w-full gap-1 sm:w-auto sm:gap-2"
        >
          {#if finishing}
            <span class="loading loading-spinner loading-xs sm:loading-sm"></span>
          {:else}
            <CheckCircleIcon size={14} class="sm:hidden" />
            <CheckCircleIcon size={16} class="hidden sm:block" />
          {/if}
          Finish Journal
        </button>
      </div>

      <!-- Finish Dialog -->
      <JournalFinishDialog bind:open={showFinishDialog} on:finish={handleFinish} on:cancel={() => (showFinishDialog = false)} />
    </div>
  </div>
</div>

<style>
  .textarea:focus {
    outline: none;
    box-shadow: 0 0 0 2px oklch(0.637 0.237 25.331 / 0.2);
  }

  /* Custom size for extra small text */
  :global(.text-2xs) {
    font-size: 0.65rem;
  }
</style>
