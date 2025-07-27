<script lang="ts">
  import PageContainer from '$lib/components/common/PageContainer.svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import { BookOpenIcon } from 'lucide-svelte';
</script>

<PageContainer>
  <AppHeader
    icon={BookOpenIcon}
    title="Journal Dashboard"
    subtitle="View and manage your journal entries"
  />
  <slot />
</PageContainer>
