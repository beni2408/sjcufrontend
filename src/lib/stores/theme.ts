import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'dark' | 'light';

function createThemeStore() {
	const initial: Theme = browser
		? ((localStorage.getItem('sjcu-theme') as Theme) ?? 'dark')
		: 'dark';

	const { subscribe, update } = writable<Theme>(initial);

	return {
		subscribe,
		toggle() {
			update((current) => {
				const next: Theme = current === 'dark' ? 'light' : 'dark';
				if (browser) {
					localStorage.setItem('sjcu-theme', next);
					document.documentElement.setAttribute('data-theme', next);
				}
				return next;
			});
		},
		init() {
			if (!browser) return;
			const saved = (localStorage.getItem('sjcu-theme') as Theme) ?? 'dark';
			document.documentElement.setAttribute('data-theme', saved);
		},
	};
}

export const themeStore = createThemeStore();
