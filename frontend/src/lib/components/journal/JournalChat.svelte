<script lang="ts">
  import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import { formatDateTime } from '$lib/utils/date';
  import type { JournalResponse, ChatMessage } from '$lib/types/journal';
  import { MessageCircleIcon, SendIcon, CheckCircleIcon, UserIcon, BotIcon } from 'lucide-svelte';
  import { marked } from 'marked';

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

  async function finishJournal() {
    try {
      finishing = true;
      error = null;

      const completedJournal = await JournalService.finishJournal(date);
      dispatch('update', completedJournal);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to finish journal';
    } finally {
      finishing = false;
    }
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

<div class="card bg-base-100 border-base-300 border shadow-xl">
  <div class="card-body p-0">
    <!-- Header -->
    <div class="border-base-300 border-b p-3 sm:p-5">
      <div class="flex items-center">
        <div class="flex items-center gap-2 sm:gap-3">
          <MessageCircleIcon size={18} class="text-primary sm:hidden" />
          <MessageCircleIcon size={24} class="text-primary hidden sm:block" />
          <div>
            <h2 class="text-lg sm:text-xl font-semibold">Reflection Session</h2>
            <p class="text-base-content/70 text-xs sm:text-sm">
              {messageCount} messages • Exploring your thoughts
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="mx-3 sm:mx-6 mt-3 sm:mt-4">
        <div class="alert alert-error p-2 sm:p-4 text-xs sm:text-sm">
          <span>{error}</span>
        </div>
      </div>
    {/if}

    <!-- Chat Messages -->
    <div bind:this={chatContainer} class="max-h-80 sm:max-h-96 flex-1 overflow-y-auto scroll-smooth p-3 sm:p-6">
      <div class="space-y-3 sm:space-y-4">
        {#each chatSession as message, i}
          <div class="flex items-start gap-2 sm:gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div
                class="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full {message.role === 'user'
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
              <div class="rounded-lg px-3 py-2 sm:px-4 sm:py-3 {message.role === 'user' ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content'}">
                <p class="prose prose-sm text-xs sm:text-sm leading-relaxed">{@html marked.parse(message.content)}</p>
              </div>

              {#if message.timestamp}
                <p class="mt-0.5 sm:mt-1 text-2xs sm:text-xs opacity-60 {message.role === 'user' ? 'text-right' : ''}">
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
              <div class="bg-secondary text-secondary-content flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full">
                <BotIcon size={12} class="sm:hidden" />
                <BotIcon size={16} class="hidden sm:block" />
              </div>
            </div>
            <div class="flex-1">
              <div class="bg-base-200 rounded-lg px-3 py-2 sm:px-4 sm:py-3">
                <div class="flex items-center gap-1">
                  <span class="loading loading-dots loading-xs sm:loading-sm"></span>
                  <span class="text-xs sm:text-sm opacity-60">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Message Input -->
    <div class="border-base-300 border-t p-3 sm:p-5">
      <div class="flex items-end gap-2">
        <div class="flex-1">
          <textarea
            data-test-id="chat-input"
            bind:value={newMessage}
            on:keydown={handleKeydown}
            placeholder="Share thoughts or ask questions..."
            class="textarea textarea-bordered w-full resize-none text-sm sm:text-base transition-all duration-200 focus:scale-[1.01] sm:focus:scale-[1.02]"
            rows="2"
            disabled={sending}
          ></textarea>
        </div>

        <button on:click={sendMessage} disabled={!newMessage.trim() || sending} class="btn btn-primary btn-sm sm:btn-md">
          {#if sending}
            <span class="loading loading-spinner loading-xs sm:loading-sm"></span>
          {:else}
            <SendIcon size={14} class="sm:hidden" />
            <SendIcon size={16} class="hidden sm:block" />
          {/if}
          <span class="hidden sm:inline">Send</span>
        </button>
      </div>
      
      <!-- Finish Button (Moved Below) -->
      <div class="mt-3 sm:mt-4 flex justify-end">
        <button 
          data-test-id="finish-journal-button" 
          on:click={finishJournal} 
          disabled={finishing} 
          class="btn btn-success btn-sm sm:btn-md gap-1 sm:gap-2 w-full sm:w-auto"
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
