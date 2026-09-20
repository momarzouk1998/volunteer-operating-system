-- تشفير الرقم القومي عند التخزين: عمود بصمة (hash) للفرادة/البحث الدقيق بدل القيد الفريد المباشر

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nationalIdHash" TEXT;
DROP INDEX IF EXISTS "User_nationalId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_nationalIdHash_key" ON "User"("nationalIdHash");
