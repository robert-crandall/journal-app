<script lang="ts">
  import PageContainer from '$lib/components/common/PageContainer.svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import { TargetIcon, ArrowLeftIcon } from 'lucide-svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import type { HeaderButton } from '$lib/components/common/HeaderButton';

  function goBack() {
    goto('/goal-alignment-summaries');
  }

  let backButton: HeaderButton = {
    label: 'Back to Analysis',
    icon: ArrowLeftIcon,
    onClick: goBack,
    class: 'btn btn-ghost btn-sm',
  };
</script>

<PageContainer>
  {#if $page.route.id === '/goal-alignment-summaries'}
    <AppHeader icon={TargetIcon} title="Goal Alignment Analysis" subtitle="Track how well your activities align with your goals over time" />
  {:else if $page.route.id === '/goal-alignment-summaries/generate'}
    <AppHeader
      icon={TargetIcon}
      title="Generate Goal Alignment Analysis"
      subtitle="Analyze how well your journal entries align with your active goals"
      buttons={[backButton]}
    />
  {:else if $page.route.id === '/goal-alignment-summaries/[id]'}
    <AppHeader icon={TargetIcon} title="Goal Alignment Analysis" subtitle="View detailed analysis results" buttons={[backButton]} />
  {/if}
  <slot />
</PageContainer>
