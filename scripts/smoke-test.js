#!/usr/bin/env node
const BASE = process.argv[2] || 'http://127.0.0.1:3000';
let p = 0, f = 0;
const ok = m => { console.log('  [PASS]', m); p++; };
const bad = m => { console.log('  [FAIL]', m); f++; };

async function req(path) {
  const r = await fetch(BASE + path);
  return { status: r.status, text: await r.text() };
}

(async () => {
  console.log('==> Smoke', BASE);
  try {
    const home = await req('/');
    if (home.status === 200) ok('GET / → 200'); else bad('GET / → ' + home.status);
  } catch (e) { bad('GET / ' + e.message); }

  try {
    const admin = await req('/admin/login');
    if ([200,302,307].includes(admin.status)) ok('GET /admin/login → ' + admin.status);
    else bad('GET /admin/login → ' + admin.status);
  } catch (e) { bad('admin ' + e.message); }

  try {
    const api = await req('/api/products');
    if ([200,401,404].includes(api.status)) ok('GET /api/products → ' + api.status);
    else bad('GET /api/products → ' + api.status);
  } catch (e) { bad('api products ' + e.message); }

  console.log('RESULT:', p, 'passed,', f, 'failed');
  process.exit(f > 0 ? 1 : 0);
})();
