const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').trim();
  if (cleaned.startsWith('0020')) {
    cleaned = '+20' + cleaned.substring(4);
  } else if (cleaned.startsWith('20') && !cleaned.startsWith('+20')) {
    cleaned = '+' + cleaned;
  } else if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '+2' + cleaned;
  }
  return cleaned;
}

async function main() {
  console.log('🌱 جاري بذر البيانات الأولية لمنظومة إدارة المتطوعين VOS...');
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // 1. إنشاء الحسابات الإدارية الأساسية الثلاثة
  const adminUsers = [
    {
      phone: normalizePhone('+201000867705'),
      name: 'الباسل',
      role: 'SUPER_ADMIN',
      volunteerCode: 'KAS-ADM01',
      governorate: 'الجيزة',
      level: 'مدير عام',
      status: 'ACTIVE',
      totalHours: 250,
      totalPoints: 3200,
    },
    {
      phone: normalizePhone('+201012611725'),
      name: 'محمود عبد الباسط',
      role: 'SUPER_ADMIN',
      volunteerCode: 'KAS-ADM02',
      governorate: 'القاهرة',
      level: 'مدير عام',
      status: 'ACTIVE',
      totalHours: 210,
      totalPoints: 2800,
    },
    {
      phone: normalizePhone('01558282760'),
      name: 'openappo',
      role: 'SUPER_ADMIN',
      volunteerCode: 'KAS-ADM03',
      governorate: 'الجيزة',
      level: 'مدير عام',
      status: 'ACTIVE',
      totalHours: 300,
      totalPoints: 4000,
    },
  ];

  for (const adm of adminUsers) {
    await prisma.user.upsert({
      where: { phone: adm.phone },
      update: {
        name: adm.name,
        role: adm.role,
        passwordHash: defaultPasswordHash,
      },
      create: {
        ...adm,
        passwordHash: defaultPasswordHash,
      },
    });
    console.log(`✅ تم إنشاء/تحديث حساب المدير: ${adm.name} (${adm.phone})`);
  }

  // 2. المحافظات
  const governorates = [
    'القاهرة', 'الجيزة', 'القليوبية', 'الإسكندرية', 'المنيا', 
    'مطروح', 'بني سويف', 'الفيوم', 'أسيوط', 'سوهاج', 
    'قنا', 'الأقصر', 'أسوان', 'البحيرة', 'الغربية'
  ];

  for (const g of governorates) {
    await prisma.governorate.upsert({
      where: { name: g },
      update: {},
      create: {
        name: g,
        targetHours: 1200,
      },
    });
  }

  // 3. الفرق
  const teams = [
    { name: 'فريق الإغاثة الميدانية', gov: 'الجيزة', leader: 'أحمد محمود حسن' },
    { name: 'فريق القوافل الطبية', gov: 'المنيا', leader: 'د. مصطفى كمال' },
    { name: 'فريق الإطعام والوجبات', gov: 'القاهرة', leader: 'خالد عبد الستار' },
    { name: 'فريق الإعلام والتوثيق', gov: 'القاهرة', leader: 'سارة علي مصطفى' },
    { name: 'فريق الدعم اللوجستي', gov: 'القليوبية', leader: 'سامح عبد الله' },
    { name: 'فريق إدارة المتطوعين', gov: 'الجيزة', leader: 'محمود الباسل' },
    { name: 'فريق البحث الميداني', gov: 'بني سويف', leader: 'عماد فكري' },
    { name: 'فريق الإسكان والإعمار', gov: 'المنيا', leader: 'محمود إبراهيم يوسف' },
  ];

  for (const t of teams) {
    await prisma.team.upsert({
      where: { name: t.name },
      update: {},
      create: {
        name: t.name,
        governorate: t.gov,
        leaderName: t.leader,
      },
    });
  }

  // 4. المتطوعون الأوائل (Sample Volunteers)
  const sampleVolunteers = [
    {
      volunteerCode: 'KAS-00001',
      name: 'أحمد محمود حسن إبراهيم',
      nationalId: '29701250102587',
      phone: normalizePhone('01011223344'),
      whatsapp: '01011223344',
      email: 'ahmed.m@example.com',
      governorate: 'الجيزة',
      city: 'الدقي',
      qualification: 'بكالوريوس تجارة',
      major: 'محاسبة',
      jobStatus: 'خريج ويعمل',
      workplace: 'شركة خاصة',
      jobTitle: 'محاسب مالي',
      experience: '5 سنوات بالعمل الخيري وإدارة الفرق الميدانية',
      skills: 'تنظيم، قيادة فرق، إكسيل، إدارة أزمات',
      preferredFields: 'إغاثة، قوافل، تنظيم',
      volunteerNature: 'ميداني ومكتبي',
      availableDays: 'الجمعة والسبت',
      status: 'ACTIVE',
      level: 'قائد قافلة',
      teamName: 'فريق الإغاثة الميدانية',
      totalHours: 120,
      totalPoints: 1450,
      rating: 4.9,
      convoysCount: 12,
      role: 'TEAM_LEADER',
    },
    {
      volunteerCode: 'KAS-00002',
      name: 'سارة علي مصطفى العدلي',
      nationalId: '29905142104582',
      phone: normalizePhone('01122334455'),
      whatsapp: '01122334455',
      email: 'sara.ali@example.com',
      governorate: 'القاهرة',
      city: 'مدينة نصر',
      qualification: 'بكالوريوس إعلام',
      major: 'صحافة وإذاعة',
      jobStatus: 'خريجة',
      workplace: 'وكالة دعاية',
      jobTitle: 'أخصائية تسويق ومحتوى',
      experience: '3 سنوات توثيق إنساني وتصوير قوافل',
      skills: 'تصوير، تصميم فوتوشوب، إدارة سوشيال ميديا',
      preferredFields: 'إعلام وتوثيق، سوشيال ميديا',
      volunteerNature: 'مكتبي وميداني',
      availableDays: 'الخميس والجمعة',
      status: 'ACTIVE',
      level: 'متميز',
      teamName: 'فريق الإعلام والتوثيق',
      totalHours: 64,
      totalPoints: 890,
      rating: 4.8,
      convoysCount: 8,
      role: 'VOLUNTEER',
    },
    {
      volunteerCode: 'KAS-00003',
      name: 'محمد طارق عثمان الشريف',
      nationalId: '30108191402145',
      phone: normalizePhone('01233445566'),
      whatsapp: '01233445566',
      email: 'm.tarek@example.com',
      governorate: 'المنيا',
      city: 'ملوي',
      qualification: 'طالب جامعي',
      major: 'كلية الطب',
      jobStatus: 'طالب',
      workplace: 'جامعة المنيا',
      jobTitle: 'طالب طب',
      experience: 'مشاركات تطوعية سابقة بالجامعة والقوافل الطبية',
      skills: 'فرز أدوية، قياس علامات حيوية، تنظيم مرضى',
      preferredFields: 'قوافل طبية، كشف وصرف علاج',
      volunteerNature: 'ميداني',
      availableDays: 'الجمعة',
      status: 'ACTIVE',
      level: 'متطوع ملتزم',
      teamName: 'فريق القوافل الطبية',
      totalHours: 40,
      totalPoints: 560,
      rating: 4.7,
      convoysCount: 5,
      role: 'VOLUNTEER',
    },
    {
      volunteerCode: 'KAS-00004',
      name: 'محمود إبراهيم يوسف الباسل',
      nationalId: '29511120104875',
      phone: normalizePhone('01066778899'),
      whatsapp: '01066778899',
      email: 'm.basel@example.com',
      governorate: 'الجيزة',
      city: 'الهرم',
      qualification: 'بكالوريوس هندسة',
      major: 'مدني',
      jobStatus: 'خريج ويعمل',
      workplace: 'مكتب استشارات',
      jobTitle: 'مهندس موقع',
      experience: '4 سنوات إنشاءات خيرية وتركيب أسقف',
      skills: 'معاينة هندسية، إشراف بناء، تخطيط لوجستي',
      preferredFields: 'تركيب أسقف، وصلات مياه، بناء',
      volunteerNature: 'ميداني',
      availableDays: 'السبت',
      status: 'ACTIVE',
      level: 'قائد فريق',
      teamName: 'فريق الإسكان والإعمار',
      totalHours: 72,
      totalPoints: 1120,
      rating: 5.0,
      convoysCount: 9,
      role: 'TEAM_LEADER',
    },
    {
      volunteerCode: 'KAS-00005',
      name: 'كريم حسام الدين عبد الرازق',
      nationalId: '29804040106633',
      phone: normalizePhone('01555667788'),
      whatsapp: '01555667788',
      email: 'kareem.h@example.com',
      governorate: 'القليوبية',
      city: 'بنها',
      qualification: 'ليسانس حقوق',
      major: 'شعبة إنجليزية',
      jobStatus: 'محام حر',
      workplace: 'مكتب محاماة',
      jobTitle: 'محام',
      experience: 'سنتان في تنظيم الفعاليات الخيرية',
      skills: 'متابعة تراخيص، تنظيم لوجستي، تعبئة',
      preferredFields: 'تنظيم، لوجستيات، تعبئة',
      volunteerNature: 'ميداني',
      availableDays: 'الجمعة والسبت',
      status: 'DISCONTINUED', // منقطع
      level: 'متطوع ملتزم',
      teamName: 'فريق الدعم اللوجستي',
      totalHours: 24,
      totalPoints: 280,
      rating: 4.2,
      convoysCount: 3,
      role: 'VOLUNTEER',
      lastActiveDate: new Date('2025-11-15'),
    },
  ];

  for (const v of sampleVolunteers) {
    const user = await prisma.user.upsert({
      where: { phone: v.phone },
      update: {},
      create: {
        ...v,
        passwordHash: defaultPasswordHash,
      },
    });

    // إضافة حركة نقاط أولية
    await prisma.pointsLedger.create({
      data: {
        volunteerId: user.id,
        points: v.totalPoints,
        type: 'رصيد افتتاحي معتمد',
        reason: 'ترحيل السجل التراكمي الميداني',
      },
    });
  }

  // 5. القوافل الميدانية
  const convoys = [
    {
      code: 'CNV-2026-01',
      title: 'قافلة الشتاء الكبرى - إغاثة العياط',
      type: 'قافلة إغاثية',
      governorate: 'الجيزة',
      location: 'قرية طهما وميت القائد - العياط',
      startDate: new Date('2026-09-18T06:30:00Z'),
      supervisor: 'أحمد محمود حسن إبراهيم',
      requiredCount: 35,
      confirmedCount: 28,
      status: 'PLANNED',
      description: 'توزيع بطاطين ومواد غذائية وصيانة منازل متضررة من السيول',
    },
    {
      code: 'CNV-2026-02',
      title: 'القافلة الطبية الشاملة والعلاج المجاني',
      type: 'قافلة طبية',
      governorate: 'المنيا',
      location: 'مركز ملوي وقرى الظهير الصحراوي',
      startDate: new Date('2026-09-24T08:00:00Z'),
      supervisor: 'د. مصطفى كمال',
      requiredCount: 25,
      confirmedCount: 20,
      status: 'PLANNED',
      description: 'عيادات باطنة، رمد، أطفال، عظام وصرف علاج لـ 1500 مستفيد',
    },
    {
      code: 'CNV-2026-03',
      title: 'مشروع إعمار وتركيب 50 سقف خرساني وخشب',
      type: 'تركيب أسقف وبناء',
      governorate: 'مطروح',
      location: 'قرى سيدي براني والنجيلة',
      startDate: new Date('2026-10-05T07:00:00Z'),
      supervisor: 'محمود الباسل',
      requiredCount: 20,
      confirmedCount: 15,
      status: 'PLANNED',
      description: 'رفع كفاءة منازل الأسر الأولى بالرعاية قبل موسم الأمطار',
    },
  ];

  for (const c of convoys) {
    await prisma.convoy.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // 6. طلبات التطوع التجريبية
  const applications = [
    {
      code: 'APP-2026-01',
      fullName: 'عمر خالد فؤاد النجار',
      phone: normalizePhone('01099881122'),
      governorate: 'الجيزة',
      city: 'الدقي',
      qualification: 'بكالوريوس حاسبات ومعلومات',
      major: 'علوم حاسب',
      skills: 'دعم فني، إدارة بيانات، تصوير',
      preferredFields: 'إدارة متطوعين، توثيق',
      source: 'الموقع الإلكتروني',
      status: 'NEW',
      decision: 'قيد المراجعة',
    },
    {
      code: 'APP-2026-02',
      fullName: 'ياسمين أشرف كامل الشريف',
      phone: normalizePhone('01144558877'),
      governorate: 'القاهرة',
      city: 'المعادي',
      qualification: 'ليسانس آداب',
      major: 'علم اجتماع',
      skills: 'بحث ميداني، تنظيم معارض، إرشاد أسري',
      preferredFields: 'معارض كساء، تجهيز عرائس',
      source: 'صفحة الفيسبوك',
      status: 'INTERVIEW',
      interviewDate: new Date('2026-09-10T11:00:00Z'),
      decision: 'موعد مقابلة',
    },
  ];

  for (const app of applications) {
    await prisma.application.upsert({
      where: { code: app.code },
      update: {},
      create: app,
    });
  }

  // 7. إعدادات النظام وقواعد النقاط
  const defaultSettings = [
    { key: 'POINTS_PER_HOUR', value: '10', category: 'GAMIFICATION', description: 'نقاط كل ساعة تطوع معتمدة' },
    { key: 'POINTS_FULL_CONVOY', value: '50', category: 'GAMIFICATION', description: 'نقاط الحضور الكامل في قافلة' },
    { key: 'POINTS_FIVE_STAR', value: '30', category: 'GAMIFICATION', description: 'نقاط التقييم المتميز 5 نجوم' },
    { key: 'POINTS_LEADERSHIP', value: '70', category: 'GAMIFICATION', description: 'نقاط قيادة فريق أو قافلة' },
    { key: 'INACTIVE_DAYS_LIMIT', value: '60', category: 'GENERAL', description: 'حد أيام عدم النشاط للتحويل لمركز الاستعادة' },
  ];

  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log('✅ اكتمل بذر البيانات بنجاح تام!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
