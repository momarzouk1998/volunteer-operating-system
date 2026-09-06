#!/bin/sh
set -e

echo "→ prisma migrate deploy..."
if ! node node_modules/prisma/build/index.js migrate deploy; then
  echo "⚠️  migrate deploy فشل — محاولة db push كحل احتياطي"
  node node_modules/prisma/build/index.js db push --skip-generate || echo "⚠️  db push فشل أيضاً — سيتم تشغيل الخادم على أي حال"
fi

echo "→ starting Next.js server..."
exec node server.js
