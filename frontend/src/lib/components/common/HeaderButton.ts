export interface HeaderButton {
  label: string;
  icon?: any; // Accept any Svelte component, including Lucide icons
  onClick: () => void;
  class?: string;
  title?: string;
  showLabel?: boolean; // for responsive label hiding
}
