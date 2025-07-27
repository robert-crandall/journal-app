
<script lang="ts">
  import PageContainer from '$lib/components/common/PageContainer.svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import { BookOpenIcon } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { formatDate } from '$lib/utils/date';
</script>

<PageContainer>
  {#if $page.route.id === '/journal'}
    <AppHeader icon={BookOpenIcon} title="Journal Dashboard" subtitle="View and manage your journal entries" />
  {:else if $page.route.id === '/journal/[date]'}
    <AppHeader icon={BookOpenIcon} title="Journal Entry" subtitle={formatDate($page.params.date)} />
  {/if}
  <slot />
</PageContainer>
