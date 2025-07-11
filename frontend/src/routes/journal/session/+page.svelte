<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { journalApi, type ChatMessage } from '$lib/api/journal';

  let sessionId = '';
  let messages: ChatMessage[] = [];
  let currentMessage = '';
  let loading = false;
  let sendingMessage = false;
  let error = '';
  let shouldOfferSave = false;
  let savingEntry = false;

  let messagesContainer: HTMLDivElement;
  let messageInput: HTMLTextAreaElement;

  // Start the session when component mounts
  onMount(async () => {
    try {
      loading = true;
      const sessionData = await journalApi.startSession();
      sessionId = sessionData.sessionId;

      // Add initial GPT message
      messages = [
        {
          role: 'assistant',
          content: sessionData.message,
          timestamp: new Date().toISOString(),
        },
      ];

      scrollToBottom();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to start journal session';
    } finally {
      loading = false;
    }
  });

  function scrollToBottom() {
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  async function sendMessage() {
    if (!currentMessage.trim() || sendingMessage) return;

    const userMessage = currentMessage.trim();
    currentMessage = '';

    // Add user message to chat
    messages = [
      ...messages,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ];

    scrollToBottom();
    sendingMessage = true;

    try {
      const response = await journalApi.sendMessage(sessionId, userMessage);

      // Add GPT response
      messages = [
        ...messages,
        {
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString(),
        },
      ];

      shouldOfferSave = response.shouldOfferSave;
      scrollToBottom();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to send message';
    } finally {
      sendingMessage = false;
    }
  }

  async function saveEntry() {
    if (savingEntry) return;

    savingEntry = true;
    try {
      const entryData = await journalApi.saveEntry(sessionId);

      // Redirect to the saved entry
      goto(`/journal/${entryData.entryId}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save journal entry';
    } finally {
      savingEntry = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function discardSession() {
    goto('/journal');
  }

  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<svelte:head>
  <title>Journal Session | Gamified Life</title>
</svelte:head>

<div class="bg-base-200 flex min-h-screen flex-col">
  <!-- Header -->
  <div class="bg-base-100 border-base-300 border-b p-4">
    <div class="mx-auto flex max-w-4xl items-center justify-between">
      <div class="flex items-center gap-3">
        <a href="/journal" class="btn btn-ghost btn-sm"> ← Back to Journal </a>
        <div class="divider divider-horizontal"></div>
        <h1 class="text-xl font-semibold">Journal Session</h1>
      </div>

      <div class="flex gap-2">
        <button class="btn btn-outline btn-sm" onclick={discardSession} disabled={savingEntry}> Discard </button>
      </div>
    </div>
  </div>

  <!-- Messages Container -->
  <div class="flex flex-1 flex-col">
    <div bind:this={messagesContainer} class="mx-auto w-full max-w-4xl flex-1 space-y-4 overflow-y-auto p-4">
      {#if loading}
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <span class="text-base-content/70 ml-3">Starting your journal session...</span>
        </div>
      {:else}
        {#each messages as message, index (index)}
          <div class="chat {message.role === 'user' ? 'chat-end' : 'chat-start'}">
            <div class="chat-image avatar">
              <div class="w-10 rounded-full {message.role === 'user' ? 'bg-base-300' : 'bg-primary'}">
                <div
                  class="flex h-full w-full items-center justify-center text-sm font-bold {message.role === 'user'
                    ? 'text-base-content'
                    : 'text-primary-content'}"
                >
                  {message.role === 'user' ? '👤' : '🤖'}
                </div>
              </div>
            </div>
            <div class="chat-header">
              {message.role === 'user' ? 'You' : 'AI Guide'}
              <time class="ml-1 text-xs opacity-50">{formatTime(message.timestamp)}</time>
            </div>
            <div class="chat-bubble {message.role === 'user' ? 'bg-base text-base-content' : 'bg-primary text-primary-content'} whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        {/each}

        {#if sendingMessage}
          <div class="chat chat-start">
            <div class="chat-image avatar">
              <div class="bg-primary w-10 rounded-full">
                <div class="text-primary-content flex h-full w-full items-center justify-center text-sm font-bold">🤖</div>
              </div>
            </div>
            <div class="chat-header">AI Guide</div>
            <div class="chat-bubble bg-primary text-primary-content">
              <span class="loading loading-dots loading-sm"></span>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="mx-auto w-full max-w-4xl p-4">
        <div class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <div>
            <button class="btn btn-sm" onclick={() => (error = '')}>Dismiss</button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Message Input -->
    <div class="bg-base-100 border-base-300 border-t p-4">
      <div class="mx-auto max-w-4xl">
        <div class="flex gap-2">
          <div class="flex-1">
            <textarea
              bind:this={messageInput}
              bind:value={currentMessage}
              onkeydown={handleKeyDown}
              placeholder={messages.length === 1 ? "Share whatever's on your mind..." : 'Continue the conversation...'}
              class="textarea textarea-bordered w-full resize-none"
              rows="2"
              disabled={sendingMessage || loading}
            ></textarea>
          </div>
          <button class="btn btn-primary" onclick={sendMessage} disabled={!currentMessage.trim() || sendingMessage || loading}>
            {#if sendingMessage}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              Send
            {/if}
          </button>
        </div>

        <div class="text-base-content/50 mt-2 flex items-center justify-between text-xs">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {#if shouldOfferSave}
            <span class="text-primary font-medium">Ready to save this journal entry</span>
          {/if}
        </div>

        <!-- Save Entry Button - Always visible when we have messages -->
        {#if messages.length > 1}
          <div class="mt-4 flex justify-center">
            <button class="btn btn-primary btn-lg gap-2" onclick={saveEntry} disabled={savingEntry}>
              {#if savingEntry}
                <span class="loading loading-spinner loading-sm"></span>
                Saving...
              {:else}
                💾 Save Entry
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
