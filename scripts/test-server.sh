#!/usr/bin/env bash
set -euo pipefail
DIR="${1:-.}"
cd "$DIR"
echo "==> Toko Online local test | $(pwd)"

pass=0; fail=0
ok(){ echo "  [PASS] $1"; pass=$((pass+1)); }
bad(){ echo "  [FAIL] $1"; fail=$((fail+1)); }

command -v node >/dev/null || { bad "Node missing"; exit 1; }
ok "Node $(node -v)"

[ -f package.json ] || { bad "package.json missing"; exit 1; }
ok "package.json"

if [ ! -d node_modules ]; then
  echo "  [INFO] npm install..."
  npm install --no-audit --no-fund 2>&1 | tail -3
fi
ok "dependencies"

if [ -f tsconfig.json ]; then
  if npx tsc --noEmit 2>/tmp/toko-tsc.log; then ok "tsc"; else bad "tsc errors"; head -15 /tmp/toko-tsc.log; fi
fi

for f in lib/db.ts lib/whatsapp.ts app/page.tsx; do
  [ -f "$f" ] && ok "found $f" || echo "  [INFO] missing $f (ok early)"
done

echo ""
echo "RESULT: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
echo "Safe to run dev / push after manual browser check."
