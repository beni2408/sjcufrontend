import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:5050/api';

export const load: PageServerLoad = async ({ params }) => {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 10000);
	try {
		const res = await fetch(`${API}/members/slug/${params.slug}`, { signal: controller.signal });
		clearTimeout(timeout);
		if (!res.ok) throw error(404, 'Member not found');
		const json = await res.json();
		return { member: json.data.member };
	} catch (err: any) {
		clearTimeout(timeout);
		if (err.status === 404) throw error(404, 'Member not found');
		throw error(500, 'Failed to load member');
	}
};
