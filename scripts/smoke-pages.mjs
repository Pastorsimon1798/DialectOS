#!/usr/bin/env node
const base = process.argv[2];
if (!base) throw new Error('Usage: node scripts/smoke-pages.mjs <base-url>');
const paths = ['/', '/robots.txt', '/sitemap.xml', '/llms.txt'];

async function smoke(baseUrl) {
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  for (const path of paths) {
    const url = new URL(path.replace(/^\//, ''), root);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url.href} returned ${res.status}`);
    const text = await res.text();
    if (!text.trim()) throw new Error(`${url.href} returned empty body`);
  }
  console.log(`Pages smoke passed for ${baseUrl}`);
}

smoke(base).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
