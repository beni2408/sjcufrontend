import { writable } from 'svelte/store';

export const isMenuOpen = writable(false);
export const isLoading = writable(false);
export const toasts = writable<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 4000) {
  const id = Math.random().toString(36).slice(2);
  toasts.update((t) => [...t, { id, message, type }]);
  setTimeout(() => {
    toasts.update((t) => t.filter((toast) => toast.id !== id));
  }, duration);
}
