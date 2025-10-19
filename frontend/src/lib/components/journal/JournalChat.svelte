<script lang="ts">
  import { createEventDispatcher, onMount, afterUpdate } from 'svelte';
  import { JournalService } from '$lib/api/journal';
  import { PhotoService } from '$lib/api/photos';
  import { DailyQuestionsService } from '$lib/api/daily-questions';
  import { formatDateTime } from '$lib/utils/date';
  import type { JournalResponse, ChatMessage } from '$lib/types/journal';
  import type { PhotoResponse } from '$lib/types/photos';
  import type { DailyQuestionResponse } from '../../../../../backend/src/db/schema';
  import { MessageCircleIcon, SendIcon, CheckCircleIcon, UserIcon, BotIcon, ImageIcon, SparklesIcon } from 'lucide-svelte';
  import Markdown from '$lib/components/common/Markdown.svelte';
  import JournalFinishDialog from './JournalFinishDialog.svelte';
  import PhotoThumbnail from '$lib/components/PhotoThumbnail.svelte';

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
  let photos: PhotoResponse[] = [];
  let loadingPhotos = true;

  // Daily question state
  let dailyQuestion: DailyQuestionResponse | null = null;
  let loadingQuestion = true;
  let questionAnswered = false;

  // Scroll to bottom when new messages are added
  afterUpdate(() => {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  onMount(async () => {
    // Load daily question and photos in parallel
    await Promise.all([loadDailyQuestion(), loadPhotos()]);

    // Scroll to bottom on initial load
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  async function loadPhotos() {
    try {
      const response = await PhotoService.listPhotos({
        linkedType: 'journal',
        journalId: journal.id,
      });
      photos = response.photos || [];
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      loadingPhotos = false;
    }
  }

  async function loadDailyQuestion() {
    try {
      const response = await DailyQuestionsService.getTodaysQuestion(date);
      if (response.question) {
        dailyQuestion = response.question;
        questionAnswered = response.question.answered;
      }
    } catch (error) {
      console.error('Failed to load daily question:', error);
    } finally {
      loadingQuestion = false;
    }
  }

  function handlePhotoUpdate(event: CustomEvent<PhotoResponse>) {
    const updatedPhoto = event.detail;
    photos = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
  }

  function handlePhotoDelete(event: CustomEvent<string>) {
    const deletedPhotoId = event.detail;
    photos = photos.filter((p) => p.id !== deletedPhotoId);
  }

  async function answerDailyQuestion(questionText: string) {
    if (!dailyQuestion || questionAnswered) return;

    // Mark question as answered
    try {
      await DailyQuestionsService.markQuestionAsAnswered(dailyQuestion.id);
      questionAnswered = true;
    } catch (error) {
      console.error('Failed to mark question as answered:', error);
    }

    // Send the question text as a message
    const messageToSend = questionText;
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
    } finally {
      sending = false;
    }
  }

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

  function formatMessageTime(timestamp: string): string {
    try {
      return formatDateTime(timestamp, 'time-only');
    } catch {
      return '';
    }
  }

  $: chatSession = journal.chatSession || [];
  $: showDailyQuestion = dailyQuestion && !questionAnswered && chatSession.length === 0;
  $: messageCount = chatSession.length + (showDailyQuestion ? 1 : 0);
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
        <!-- Daily Question of the Day (shown first if no chat messages exist) -->
        {#if showDailyQuestion}
          <div class="flex items-start gap-2 sm:gap-3">
            <!-- Avatar with special icon for daily question -->
            <div class="flex-shrink-0">
              <div class="bg-accent text-accent-content flex h-6 w-6 items-center justify-center rounded-full sm:h-8 sm:w-8">
                <SparklesIcon size={12} class="sm:hidden" />
                <SparklesIcon size={16} class="hidden sm:block" />
              </div>
            </div>

            <!-- Daily Question Content -->
            <div class="max-w-[75%] flex-1 sm:max-w-md lg:max-w-lg">
              <div class="border-accent bg-accent/10 rounded-lg border px-3 py-2 sm:px-4 sm:py-3">
                <div class="text-accent mb-2 flex items-center gap-1 text-xs font-medium sm:text-sm">
                  <SparklesIcon size={12} class="sm:hidden" />
                  <SparklesIcon size={14} class="hidden sm:block" />
                  Question of the Day
                </div>
                <Markdown content={dailyQuestion?.questionText || ''} classes="leading-relaxed text-base-content" />
              </div>
              <div class="mt-2">
                <button
                  type="button"
                  class="btn btn-accent btn-sm"
                  on:click={() => dailyQuestion && answerDailyQuestion(dailyQuestion.questionText)}
                  disabled={sending}
                >
                  {#if sending}
                    <span class="loading loading-spinner loading-xs"></span>
                    Answering...
                  {:else}
                    Answer this question
                  {/if}
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Regular Chat Messages -->
        {#each chatSession as message, i (message)}
          <div class="flex items-start gap-2 sm:gap-3 {message.role === 'user' ? 'flex-row-reverse' : ''}" data-test-role="{message.role}-message">
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
                <Markdown content={message.content} classes="leading-relaxed {message.role === 'user' ? 'text-primary-content' : 'text-base-content'}" />
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
            placeholder="Share thoughts or ask questions..."
            class="textarea textarea-bordered focus:border-primary w-full resize-none text-sm focus:outline-none sm:text-base"
            rows="1"
            disabled={sending}
          ></textarea>
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

    <!-- Photos Display -->
    {#if photos.length > 0}
      <div class="bg-base-100 border-t p-4">
        <h3 class="text-base-content/70 mb-3 text-sm font-semibold">
          Photos ({photos.length})
        </h3>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {#each photos as photo}
            <PhotoThumbnail {photo} class="aspect-square" on:update={handlePhotoUpdate} on:delete={handlePhotoDelete} />
          {/each}
        </div>
      </div>
    {/if}
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
