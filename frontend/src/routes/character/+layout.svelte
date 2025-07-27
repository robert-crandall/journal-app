<script lang="ts">
  import PageContainer from '$lib/components/common/PageContainer.svelte';
  import AppHeader from '$lib/components/common/AppHeader.svelte';
  import { UserIcon } from 'lucide-svelte';
</script>

<PageContainer>
  <AppHeader title="Your Character" subtitle="Create and manage your character to start your gamified life journey" icon={UserIcon} />
  <slot />
</PageContainer>
