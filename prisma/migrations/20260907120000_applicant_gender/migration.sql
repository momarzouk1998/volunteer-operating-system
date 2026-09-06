-- طلب العميل 2026-09-07: إضافة حقل النوع (ذكر / أنثى) إجباري في فورم الانضمام

ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" TEXT;
