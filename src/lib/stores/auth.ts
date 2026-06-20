import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { User } from '$lib/types/index.js';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

const initial: AuthState = {
  user: browser ? JSON.parse(localStorage.getItem('sjcu_admin_user') || 'null') : null,
  token: browser ? localStorage.getItem('sjcu_admin_token') : null,
  loading: false,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initial);

  return {
    subscribe,
    login: (token: string, user: User) => {
      if (browser) {
        localStorage.setItem('sjcu_admin_token', token);
        localStorage.setItem('sjcu_admin_user', JSON.stringify(user));
      }
      set({ user, token, loading: false });
    },
    logout: () => {
      if (browser) {
        localStorage.removeItem('sjcu_admin_token');
        localStorage.removeItem('sjcu_admin_user');
      }
      set({ user: null, token: null, loading: false });
    },
    updateUser: (user: User) => {
      if (browser) localStorage.setItem('sjcu_admin_user', JSON.stringify(user));
      update((s) => ({ ...s, user }));
    },
    setLoading: (loading: boolean) => update((s) => ({ ...s, loading })),
    isAuthenticated: () => {
      let auth: AuthState = initial;
      const unsubscribe = { subscribe }.subscribe((v) => (auth = v));
      return !!auth.token && !!auth.user;
    },
  };
}

export const authStore = createAuthStore();
