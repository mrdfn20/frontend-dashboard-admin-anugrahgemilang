import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-node: dipakai buat deploy ke VPS/server sendiri (bukan Vercel/Netlify) -
		// hasil build jadi Node.js server standalone yang dijalanin via PM2 di belakang nginx.
		adapter: adapter()
	}
};

export default config;
