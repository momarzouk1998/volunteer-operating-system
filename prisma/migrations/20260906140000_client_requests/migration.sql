-- طلبات العميل 2026-09-06: بيانات التطوع السابق + تغيير كلمة المرور الإجباري + استعادة كلمة المرور

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "volunteeredBefore" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "prevOrg" TEXT,
  ADD COLUMN IF NOT EXISTS "prevRole" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "prevOrg" TEXT,
  ADD COLUMN IF NOT EXISTS "prevRole" TEXT,
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
  ADD COLUMN IF NOT EXISTS "resetTokenExp" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_resetToken_key" ON "User"("resetToken");
