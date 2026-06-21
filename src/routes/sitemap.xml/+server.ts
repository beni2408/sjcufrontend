import type { RequestHandler } from '@sveltejs/kit';

const DOMAIN = 'https://stjohnscarolunion.com';

const routes = [
	{ path: '/',                      priority: '1.0', changefreq: 'weekly'  },
	{ path: '/production-enquiry',    priority: '0.7', changefreq: 'monthly' },
	{ path: '/terms-and-conditions',  priority: '0.3', changefreq: 'yearly'  },
];

export const GET: RequestHandler = () => {
	const today = new Date().toISOString().split('T')[0];

	const urls = routes
		.map(
			({ path, priority, changefreq }) => `
  <url>
    <loc>${DOMAIN}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
		)
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600',
		},
	});
};
