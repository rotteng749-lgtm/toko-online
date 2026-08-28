const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

async function main() {
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '-p', '3895'], {
    cwd: __dirname, stdio: 'pipe', shell: false,
  });
  let ready = false;
  server.stdout.on('data', d => { if (d.toString().includes('Ready')) ready = true; });
  for (let i = 0; i < 40 && !ready; i++) await new Promise(r => setTimeout(r, 1000));
  if (!ready) await new Promise(r => setTimeout(r, 5000));

  const browser = await puppeteer.launch({
    headless: 'new', executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();

  await page.setContent(`<html><body><div id="r"></div>
<script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js","three/addons/":"https://unpkg.com/three@0.160.0/examples/jsm/"}}</script>
<script type="module">
import*as T from'three';import{FBXLoader}from'three/addons/loaders/FBXLoader.js';
const r=document.getElementById('r');
let out='';
function L(s){out+=s+'\\n';r.innerText=out;}
new FBXLoader().load('http://127.0.0.1:3895/models/elaina-vr/Elaina%20sk.fbx',fbx=>{
  L('=== SKELETON ===');
  fbx.traverse(c=>{
    if(c.skeleton){
      L('Skeleton on "'+c.name+'": '+c.skeleton.bones.length+' bones');
      c.skeleton.bones.forEach((b,i)=>L('  ['+i+'] '+b.name));
    }
  });
  L('\\n=== ALL BONES ===');
  const bones=[];
  fbx.traverse(c=>{if(c.isBone||c.type==='Bone')bones.push(c.name);});
  bones.forEach(n=>L('  '+n));
  L('\\n=== MESHES ===');
  fbx.traverse(c=>{
    if(c.isMesh){
      const m=Array.isArray(c.material)?c.material:[c.material];
      L(c.name+' ['+c.type+'] mats='+m.map(x=>x.name).join(','));
    }
  });
},e=>{},e=>L('ERR:'+e));
</script></body></html>`, { waitUntil: 'networkidle2', timeout: 30000 });

  await new Promise(r => setTimeout(r, 15000));
  const text = await page.evaluate(() => document.getElementById('r')?.innerText || 'empty');
  console.log(text);

  await browser.close();
  server.kill();
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
