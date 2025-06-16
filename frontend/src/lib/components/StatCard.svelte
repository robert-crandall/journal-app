<script lang="ts">
  import { Icon } from 'lucide-svelte';
  
  interface Props {
    title: string;
    value: string | number;
    icon: any;
    color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
    iconClass?: string;
    valueClass?: string;
  }
  
  let { title, value, icon, color = 'primary', iconClass, valueClass = 'text-3xl font-bold' }: Props = $props();
  
  let computedIconClass = $derived(() => {
    if (iconClass) return iconClass;
    switch (color) {
      case 'success': return 'text-success';
      case 'error': return 'text-error';
      case 'warning': return 'text-warning';
      case 'info': return 'text-info';
      case 'secondary': return 'text-secondary';
      case 'accent': return 'text-accent';
      default: return 'text-primary';
    }
  });
</script>

<div class="stat">
  <div class="stat-figure {computedIconClass}">
    <Icon {icon} size={32} />
  </div>
  <div class="stat-title">{title}</div>
  <div class="stat-value {valueClass}">{value}</div>
</div>
