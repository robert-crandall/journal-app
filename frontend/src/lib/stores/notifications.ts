import { writable } from 'svelte/store';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message?: string;
  duration?: number;
  xpGained?: number;
  statName?: string;
}

export const notifications = writable<Notification[]>([]);

export function addNotification(notification: Omit<Notification, 'id'>) {
  const id = crypto.randomUUID();
  const newNotification: Notification = {
    id,
    duration: 2000, // Default 2 seconds for XP notifications
    ...notification
  };

  notifications.update(items => [...items, newNotification]);

  // Auto-remove after duration
  if (newNotification.duration && newNotification.duration > 0) {
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);
  }

  return id;
}

export function removeNotification(id: string) {
  notifications.update(items => items.filter(item => item.id !== id));
}

// Convenience function for XP notifications
export function showXPNotification(statName: string, xpGained: number) {
  return addNotification({
    type: 'success',
    title: `+${xpGained} XP`,
    message: `${statName} improved!`,
    xpGained,
    statName,
    duration: 2000
  });
}

// Convenience function for negative XP notifications
export function showNegativeXPNotification(statName: string, xpLost: number) {
  return addNotification({
    type: 'warning',
    title: `-${Math.abs(xpLost)} XP`,
    message: `${statName} decreased`,
    xpGained: xpLost,
    statName,
    duration: 2000
  });
}
