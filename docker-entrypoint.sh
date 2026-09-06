#!/bin/sh
set -e

# مزامنة مخطط قاعدة البيانات (إضافة الجداول/الأعمدة الجديدة) قبل تشغيل الخادم
echo "→ prisma db push (sync schema)..."
node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss || {
  echo "⚠️  prisma db push فشل — سيتم تشغيل الخادم على أي حال"
}

echo "→ starting Next.js server..."
exec node server.js
