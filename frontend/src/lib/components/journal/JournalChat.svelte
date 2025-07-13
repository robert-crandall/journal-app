<script lang="ts">
  import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import type { JournalResponse, ChatMessage } from '$lib/types/journal';
  import { MessageCircleIcon, SendIcon, CheckCircleIcon, UserIcon, BotIcon } from 'lucide-svelte';

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
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
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
    <div class="p-6 border-b border-base-300">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <MessageCircleIcon size={24} class="text-primary" />
          <div>
            <h2 class="text-xl font-semibold">Reflection Session</h2>
            <p class="text-sm text-base-content/70">
              {messageCount} messages • Exploring your thoughts
            </p>
          </div>
        </div>

        <button
          on:click={finishJournal}
          disabled={finishing}
          class="btn btn-success gap-2"
        >
          {#if finishing}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            <CheckCircleIcon size={16} />
          {/if}
          Finish Journal
        </button>
      </div>
    </div>

    <!-- Error Message -->
    {#if error}
      <div class="mx-6 mt-4">
        <div class="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    {/if}

    <!-- Chat Messages -->
    <div
      bind:this={chatContainer}
      class="flex-1 p-6 max-h-96 overflow-y-auto scroll-smooth"
    >
      <div class="space-y-4">
        {#each chatSession as message, i}
          <div class="flex items-start gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-full flex items-center justify-center {
                message.role === 'user' ? 'bg-primary text-primary-content' : 'bg-secondary text-secondary-content'
              }">
                {#if message.role === 'user'}
                  <UserIcon size={16} />
                {:else}
                  <BotIcon size={16} />
                {/if}
              </div>
            </div>

            <!-- Message Content -->
            <div class="flex-1 max-w-xs sm:max-w-md lg:max-w-lg {message.role === 'user' ? 'text-right' : ''}">
              <div class="px-4 py-3 rounded-lg {
                message.role === 'user' 
                  ? 'bg-primary text-primary-content' 
                  : 'bg-base-200 text-base-content'
              }">
                <p class="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {#if message.timestamp}
                <p class="text-xs opacity-60 mt-1 {message.role === 'user' ? 'text-right' : ''}">
                  {formatMessageTime(message.timestamp)}
                </p>
              {/if}
            </div>
          </div>
        {/each}

        <!-- Typing indicator when sending -->
        {#if sending}
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                <BotIcon size={16} />
              </div>
            </div>
            <div class="flex-1">
              <div class="px-4 py-3 rounded-lg bg-base-200">
                <div class="flex items-center gap-1">
                  <span class="loading loading-dots loading-sm"></span>
                  <span class="text-sm opacity-60">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Message Input -->
    <div class="p-6 border-t border-base-300">
      <div class="flex items-end gap-3">
        <div class="flex-1">
          <textarea
            bind:value={newMessage}
            on:keydown={handleKeydown}
            placeholder="Share more thoughts, ask questions, or reflect deeper..."
            class="textarea textarea-bordered w-full resize-none transition-all duration-200 focus:scale-[1.02]"
            rows="2"
            disabled={sending}
          ></textarea>
          <div class="label">
            <span class="label-text-alt text-xs opacity-60">
              Press Enter to send, Shift+Enter for new line
            </span>
          </div>
        </div>
        
        <button
          on:click={sendMessage}
          disabled={!newMessage.trim() || sending}
          class="btn btn-primary gap-2"
        >
          {#if sending}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            <SendIcon size={16} />
          {/if}
          Send
        </button>
      </div>
    </div>

    <!-- Help Text -->
    <div class="mx-6 mb-6">
      <div class="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
        <h3 class="font-medium text-sm mb-2">💬 Reflection Tips</h3>
        <ul class="text-sm text-base-content/80 space-y-1">
          <li>• Explore your thoughts and feelings in more depth</li>
          <li>• Ask the AI questions about your experiences</li>
          <li>• Reflect on patterns, insights, or new perspectives</li>
          <li>• When finished, click "Finish Journal" to complete your entry</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  .textarea:focus {
    outline: none;
    box-shadow: 0 0 0 2px oklch(0.637 0.237 25.331 / 0.2);
  }
</style>
