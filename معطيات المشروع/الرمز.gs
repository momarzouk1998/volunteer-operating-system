/**
 * ==============================================================================
 * نظام إدارة وتشغيل المتطوعين - جمعية خواطر أحلى شباب
 * الإصدار: 2026 (Enterprise Core)
 * الاتجاه: RTL كامل | اللغة: العربية | الهيكل: Dynamic Header Mapping
 * ==============================================================================
 */

// الثوابت الأساسية وأسماء الصفحات
const APP_CONFIG = {
  INSTITUTION_NAME: "جمعية خواطر أحلى شباب",
  SYSTEM_TITLE: "نظام إدارة وتشغيل المتطوعين",
  COLOR_PRIMARY: "#0f2b48",
  COLOR_SECONDARY: "#1a365d",
  COLOR_ACCENT: "#2b6cb0",
  COLOR_LIGHT: "#f0f4f8",
  SHEETS: {
    DASHBOARD: "Dashboard",
    VOLUNTEERS: "المتطوعون",
    APPLICATIONS: "طلبات التطوع",
    INTERVIEWS: "المقابلات",
    TRAINING: "التدريب والتأهيل",
    ASSIGNMENTS: "التكليفات",
    ATTENDANCE: "الحضور",
    EVALUATION: "التقييم",
    REWARDS: "التقدير والمكافآت",
    RESTORE: "استعادة القدامى",
    BEST: "أفضل المتطوعين",
    GOVERNORATES: "المحافظات والفرق",
    REPORTS: "التقارير",
    SETTINGS: "الإعدادات"
  }
};

/**
 * بناء خريطة ديناميكية لأرقام الأعمدة بناءً على الاسم العربي في الصف الأول
 * لمنع تعطل الكود إذا تم تغيير ترتيب الأعمدة لاحقاً.
 */
function getHeaderMap(sheet) {
  if (!sheet) return {};
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  headers.forEach((header, index) => {
    if (header && String(header).trim() !== "") {
      map[String(header).trim()] = index + 1; // رقم العمود يبدأ من 1
    }
  });
  return map;
}

/**
 * إنشاء القائمة المخصصة في واجهة Google Sheets تلقائياً عند الفتح
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏛️ إدارة أحلى شباب')
    .addItem('📊 تحديث لوحة المؤشرات (Dashboard)', 'refreshDashboard')
    .addSeparator()
    .addItem('👤 إضافة متطوع جديد', 'openAddVolunteerModal')
    .addItem('🔎 البحث الشامل عن متطوع', 'openSearchVolunteerModal')
    .addSeparator()
    .addItem('📌 تكليف بمهمة / قافلة', 'openAssignmentModal')
    .addItem('⚡ تسجيل حضور ومشاركة', 'openAttendanceModal')
    .addItem('⭐ تقييم متطوع', 'openEvaluationModal')
    .addItem('🏅 تسجيل مكافأة / تقدير', 'openRewardModal')
    .addItem('🔄 متابعة استعادة متطوع قديم', 'openRestoreModal')
    .addSeparator()
    .addItem('⚙️ التهيئة الشاملة للنظام وقواعد البيانات', 'setupSystem')
    .addToUi();
}

/**
 * ==============================================================================
 * التهيئة الشاملة للنظام وبناء الجداول والتنسيقات وقواعد البيانات (Setup Engine)
 * ==============================================================================
 */
function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // تعريف هيكل كل ورقة عمل بدقة تامة
  const schema = {
    [APP_CONFIG.SHEETS.DASHBOARD]: [],
    [APP_CONFIG.SHEETS.VOLUNTEERS]: [
      "كود المتطوع", "تاريخ التسجيل", "الاسم رباعي", "الرقم القومي", "تاريخ الميلاد", "السن", "الجنسية", 
      "المحافظة", "المركز / المدينة", "العنوان", "الهاتف", "واتساب", "البريد الإلكتروني", "المؤهل", 
      "الكلية / التخصص", "الحالة الحالية", "جهة العمل / الدراسة", "المهنة", "الخبرات", "المهارات", 
      "المجالات المفضلة", "طبيعة التطوع", "الأيام المتاحة", "الفترة", "الساعات أسبوعيًا", "إمكانية السفر", 
      "الاهتمامات", "أهداف التطوع", "الخبرة القيادية", "الرغبة في القيادة", "بيانات الطوارئ", "احتياجات يجب مراعاتها", 
      "مصدر التعرف على الجمعية", "الشخص المرشح", "حالة المتطوع", "مستوى المتطوع", "الفريق", "قائد الفريق", 
      "آخر مشاركة", "عدد القوافل", "ساعات التطوع", "متوسط التقييم", "النقاط", "المكافآت", "آخر تواصل", "ملاحظات"
    ],
    [APP_CONFIG.SHEETS.APPLICATIONS]: [
      "كود الطلب", "تاريخ التقديم", "اسم المتقدم", "الهاتف", "المحافظة", "مصدر التقديم", 
      "حالة الطلب", "موعد المقابلة", "قرار اللجنة", "كود المتطوع", "مسؤول المراجعة", "ملاحظات"
    ],
    [APP_CONFIG.SHEETS.INTERVIEWS]: [
      "كود المتطوع", "اسم المتطوع", "تاريخ المقابلة", "المحاور", "الالتزام والمسؤولية", 
      "العمل الجماعي", "التعامل مع المستفيدين", "الخبرة والمهارات", "القيادة", "مجموع الدرجات", "التوصية", "الملاحظات"
    ],
    [APP_CONFIG.SHEETS.TRAINING]: [
      "كود المتطوع", "اسم المتطوع", "اسم التدريب", "نوع التدريب", "التاريخ", 
      "المدرب", "الحضور", "نتيجة التقييم", "حالة التدريب", "الملاحظات"
    ],
    [APP_CONFIG.SHEETS.ASSIGNMENTS]: [
      "رقم التكليف", "كود المتطوع", "اسم المتطوع", "القافلة / النشاط", "نوع المهمة", 
      "المحافظة", "التاريخ", "الدور", "المسؤول المباشر", "حالة المهمة", "النتيجة", "الملاحظات"
    ],
    [APP_CONFIG.SHEETS.ATTENDANCE]: [
      "رقم السجل", "كود المتطوع", "الاسم", "القافلة / النشاط", "المحافظة", 
      "التاريخ", "حالة الحضور", "عدد الساعات", "النقاط المكتسبة", "الملاحظات"
    ],
    [APP_CONFIG.SHEETS.EVALUATION]: [
      "كود المتطوع", "اسم المتطوع", "تاريخ التقييم", "الالتزام", "التعاون", 
      "المبادرة", "السلوك مع المستفيدين", "النتيجة", "الملاحظات", "التوصية"
    ],
    [APP_CONFIG.SHEETS.REWARDS]: [
      "كود المتطوع", "اسم المتطوع", "التاريخ", "نوع التقدير", "سبب الاستحقاق", 
      "النقاط", "المعتمد", "حالة التنفيذ", "الملاحظات"
    ],
    [APP_CONFIG.SHEETS.RESTORE]: [
      "كود المتطوع", "اسم المتطوع", "المحافظة", "آخر مشاركة", "سبب الابتعاد", 
      "ما كان يحفزه", "ما يشجعه على العودة", "المجال المفضل", "الوقت المتاح", 
      "هل يرغب في العودة؟", "آخر تواصل", "نتيجة التواصل", "الإجراء التالي", "مسؤول المتابعة", "الملاحظات"
    ],
    [APP_CONFIG.SHEETS.BEST]: [
      "الترتيب", "كود المتطوع", "الاسم", "المحافظة", "الفريق", "إجمالي النقاط", 
      "عدد المشاركات", "ساعات التطوع", "متوسط التقييم", "المستوى"
    ],
    [APP_CONFIG.SHEETS.GOVERNORATES]: [
      "المحافظة", "الفريق", "قائد الفريق", "نائب القائد", "عدد المتطوعين", 
      "عدد النشطين", "إجمالي الساعات", "آخر نشاط", "الملاحظات"
    ],
    [APP_CONFIG.SHEETS.REPORTS]: [
      "المؤشر الإحصائي", "القيمة الإجمالية", "ملاحظات وتفاصيل دورية"
    ],
    [APP_CONFIG.SHEETS.SETTINGS]: [
      "المحافظات", "حالات المتطوع", "مستويات المتطوع", "أنواع المهام", 
      "حالات المهام", "أنواع التدريب", "أنواع التقدير", "قواعد النقاط", "أنواع الفرق", "مصادر التعرف"
    ]
  };

  // إنشاء وتنسيق كل ورقة
  for (const sheetName in schema) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    sheet.setRightToLeft(true);
    const headers = schema[sheetName];

    if (headers.length > 0 && sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground(APP_CONFIG.COLOR_PRIMARY)
                 .setFontColor("#ffffff")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center")
                 .setVerticalAlignment("middle");
      sheet.setFrozenRows(1);
    }
  }

  // ملء صفحة الإعدادات بالقيم الافتراضية المعتمدة لجمعية أحلى شباب
  setupDefaultSettings(ss.getSheetByName(APP_CONFIG.SHEETS.SETTINGS));

  // ملء بيانات تجريبية مؤسسية للاختبار والتشغيل المباشر
  seedInitialData(ss);

  // تحديث لوحة التحكم
  refreshDashboard();

  SpreadsheetApp.getUi().alert("نجاح التهيئة", "تم تأسيس جميع صفحات النظام، قواعد البيانات، والتنسيقات المؤسسية لجمعية خواطر أحلى شباب بنجاح!", SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * ملء الإعدادات والقوائم المنسدلة الافتراضية
 */
function setupDefaultSettings(sheet) {
  if (!sheet || sheet.getLastRow() > 1) return;
  
  const settingsData = [
    ["القاهرة", "نشط", "متطوع جديد", "قافلة إغاثية", "قيد التنفيذ", "تأهيل متطوعين جدد", "شهادة تقدير", "ساعة تطوع = 10 نقاط", "فريق الإغاثة الميدانية", "صفحة الفيسبوك"],
    ["الجيزة", "غير نشط", "متطوع ملتزم", "قافلة طبية", "مكتملة", "إسعافات أولية", "درع التميز", "حضور قافلة كاملة = 50 نقطة", "فريق القوافل الطبية", "ترشيح من متطوع قديم"],
    ["القليوبية", "متميز", "قائد فريق", "إطعام وتوزيع وجبات", "ملغاة", "إدارة العمل التطوعي", "متطوع الشهر", "تقييم 5 نجوم = 30 نقطة", "فريق الإطعام والوجبات", "معارض الجامعات"],
    ["الإسكندرية", "قائد قافلة", "قائد قافلة", "زكاة مال وكساء", "مؤجلة", "مهارات القيادة والتنظيم", "تكريم سنوي", "مبادرة مبتكرة = 100 نقطة", "فريق الإعلام والتوثيق", "موقع الجمعية"],
    ["المنيا", "قائد محافظة", "قائد محافظة", "حفر ووصلات مياه", "", "التوثيق وصناعة المحتوى", "رسالة شكر رسمية", "قيادة فريق = 70 نقطة", "فريق الدعم اللوجستي", "فعاليات وأنشطة عامة"],
    ["مطروح", "منقطع", "عضو شرفي", "تركيب أسقف وبناء", "", "التواصل الفعال مع الأسر", "", "", "فريق إدارة المتطوعين", "إعلانات ممولة"],
    ["بني سويف", "مستبعد", "", "تجهيز عرائس وأجهزة", "", "", "", "", "فريق البحث الميداني", "أخرى"],
    ["الفيوم", "في قائمة الانتظار", "", "ذبح وتوزيع لحوم", "", "", "", "", "", ""],
    ["أسيوط", "", "", "تنظيم معارض خيرية", "", "", "", "", "", ""],
    ["سوهاج", "", "", "دعم لوجستي وتخزين", "", "", "", "", "", ""],
    ["قنا", "", "", "إعلام وتوثيق", "", "", "", "", "", ""],
    ["الأقصر", "", "", "سوشيال ميديا", "", "", "", "", "", ""],
    ["أسوان", "", "", "إدارة وحوكمة", "", "", "", "", "", ""],
    ["البحيرة", "", "", "تدريب وتطوير", "", "", "", "", "", ""],
    ["الغربية", "", "", "تنمية موارد وتبرعات", "", "", "", "", "", ""]
  ];

  sheet.getRange(2, 1, settingsData.length, settingsData[0].length).setValues(settingsData);
}

/**
 * ملء بيانات واقعية أولية للاختبار والتحقق من سير العمليات
 */
/**
 * ملء بيانات واقعية أولية للاختبار والتحقق من سير العمليات
 */
function seedInitialData(spreadsheet) {
  // جلب الملف النشط تلقائياً إذا لم يتم تمرير المتغير
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  const volSheet = ss.getSheetByName(APP_CONFIG.SHEETS.VOLUNTEERS);
  if (volSheet && volSheet.getLastRow() === 1) {
    const sampleVols = [
      ["KAS-00001", "2025-01-15", "أحمد محمود حسن إبراهيم", "29701250102587", "1997-01-25", 29, "مصري", "الجيزة", "الدقي", "شارع التحرير", "01011223344", "01011223344", "ahmed.m@example.com", "بكالوريوس تجارة", "محاسبة", "خريج ويعمل", "شركة خاصة", "محاسب مالي", "5 سنوات بالعمل الخيري", "تنظيم، قيادة فرق، إكسيل", "إغاثة، قوافل، تنظيم", "ميداني ومكتبي", "الجمعة والسبت", "صباحية ومسائية", 10, "نعم", "العمل الإنساني وتطوير القرى", "خدمة المجتمع وتنمية المهارات", "قاد أكثر من 15 قافلة", "نعم بشدة", "محمود حسن - 01099887766", "لا يوجد", "ترشيح من صديق", "محمد علي", "نشط", "قائد قافلة", "فريق الإغاثة الميدانية", "أحمد محمود حسن", "2026-08-20", 12, 120, 4.9, 1450, 4, "2026-08-22", "متطوع قيادي متميز ومنضبط جداً"],
      ["KAS-00002", "2025-03-10", "سارة علي مصطفى العدلي", "29905142104582", "1999-05-14", 27, "مصرية", "القاهرة", "مدينة نصر", "شارع عباس العقاد", "01122334455", "01122334455", "sara.ali@example.com", "بكالوريوس إعلام", "صحافة وإذاعة", "خريجة", "وكالة دعاية", "أخصائية تسويق", "3 سنوات تصوير وتوثيق", "تصوير، تصميم فوتوشوب، إدارة محتوى", "إعلام وتوثيق، سوشيال ميديا", "مكتبي وميداني", "الخميس والجمعة", "مسائية", 6, "نعم", "التوثيق الإنساني ونقل القصص", "إبراز أثر المساعدات", "مسؤولة لجنة إعلامية سابقاً", "نعم", "علي مصطفى - 01155443322", "لا يوجد", "صفحة الفيسبوك", "-", "نشط", "متميز", "فريق الإعلام والتوثيق", "سارة علي", "2026-08-18", 8, 64, 4.8, 890, 2, "2026-08-20", "ملتزمة ومبدعة في التغطيات الميدانية"],
      ["KAS-00003", "2025-06-01", "محمد طارق عثمان الشريف", "30108191402145", "2001-08-19", 25, "مصري", "المنيا", "ملوي", "شارع الجمهورية", "01233445566", "01233445566", "m.tarek@example.com", "طالب جامعي", "كلية الطب", "طالب", "جامعة المنيا", "طالب", "مشاركات تطوعية سابقة بالجامعة", "فرز أدوية، تنظيم قوافل علاجية", "قوافل طبية، كشف وصرف علاج", "ميداني", "الجمعة", "صباحية", 8, "نعم بالمحافظات المجاورة", "الرعاية الصحية للمستحقين", "اكتساب خبرة وتقديم العون", "لا يوجد", "مستقبلاً", "طارق عثمان - 01277889900", "حساسية من الغبار", "معرض الجامعة", "أحمد محمود", "نشط", "متطوع ملتزم", "فريق القوافل الطبية", "د. مصطفى كمال", "2026-08-15", 5, 40, 4.7, 560, 1, "2026-08-17", "دقيق ومنظم في فرز وتوزيع الأدوية"],
      ["KAS-00004", "2024-11-20", "محمود إبراهيم يوسف الباسل", "29511120104875", "1995-11-12", 30, "مصري", "الجيزة", "الهرم", "شارع فيصل", "01066778899", "01066778899", "m.basel@example.com", "بكالوريوس هندسة", "مدني", "خريج ويعمل", "مكتب استشارات", "مهندس موقع", "4 سنوات إنشاءات خيرية", "معاينة هندسية، إشراف بناء", "تركيب أسقف، وصلات مياه، بناء", "ميداني", "السبت", "صباحية", 8, "نعم", "تحسين بيئة السكن للأسر الأولى بالرعاية", "تطوير العمل الهندسي الخيري", "مدير مشروعات تطوعية", "نعم", "إبراهيم يوسف - 01011559933", "لا يوجد", "ترشيح من متطوع قديم", "أحمد محمود حسن", "نشط", "قائد فريق", "فريق الإسكان والإعمار", "محمود الباسل", "2026-08-10", 9, 72, 5.0, 1120, 3, "2026-08-12", "أشرف بنجاح على مشاريع الأسقف والمياه في محافظتي المنيا ومطروح"],
      ["KAS-00005", "2024-02-10", "كريم حسام الدين عبد الرازق", "29804040106633", "1998-04-04", 28, "مصري", "القليوبية", "بنها", "شارع كلية التجارة", "01555667788", "01555667788", "kareem.h@example.com", "ليسانس حقوق", "شعبة إنجليزية", "محام حر", "مكتب محاماة", "محام", "سنتان في تنظيم الفعاليات", "متابعة تراخيص، تنظيم لوجستي", "تنظيم، لوجستيات، تعبئة", "ميداني", "الجمعة والسبت", "مسائية", 5, "لا", "العمل الإنساني المنظم", "المشاركة الفعالة", "عضو لجنة تنظيم", "لا", "حسام عبد الرازق - 01511224488", "لا يوجد", "صفحة الفيسبوك", "-", "منقطع", "متطوع ملتزم", "فريق الدعم اللوجستي", "سامح عبد الله", "2025-11-15", 3, 24, 4.2, 280, 0, "2026-05-10", "انقطع بسبب ضغوطات العمل وظروف السفر - مستهدف للاستعادة"]
    ];
    volSheet.getRange(2, 1, sampleVols.length, sampleVols[0].length).setValues(sampleVols);
  }

  // حضور تجريبي
  const attSheet = ss.getSheetByName(APP_CONFIG.SHEETS.ATTENDANCE);
  if (attSheet && attSheet.getLastRow() === 1) {
    const sampleAtt = [
      ["ATT-1001", "KAS-00001", "أحمد محمود حسن إبراهيم", "قافلة إغاثة مطروح الكبرى", "مطروح", "2026-08-20", "حاضر", 12, 120, "حضور كامل وقيادة ميدانية ممتازة"],
      ["ATT-1002", "KAS-00002", "سارة علي مصطفى العدلي", "توثيق وتغطية قافلة مطروح", "مطروح", "2026-08-18", "حاضر", 8, 80, "تغطية ممتازة وتصوير احترافي"],
      ["ATT-1003", "KAS-00003", "محمد طارق عثمان الشريف", "القافلة الطبية بقرى المنيا", "المنيا", "2026-08-15", "حاضر", 8, 80, "أشرف على صرف أكثر من 200 روشتة علاجية"],
      ["ATT-1004", "KAS-00004", "محمود إبراهيم يوسف الباسل", "مشروع تركيب أسقف المنيا", "المنيا", "2026-08-10", "حاضر", 10, 100, "تسليم 15 سقف خرساني وخشب بمستوى هندسي عالٍ"]
    ];
    attSheet.getRange(2, 1, sampleAtt.length, sampleAtt[0].length).setValues(sampleAtt);
  }

  // طلبات تطوع تجريبية
  const appSheet = ss.getSheetByName(APP_CONFIG.SHEETS.APPLICATIONS);
  if (appSheet && appSheet.getLastRow() === 1) {
    const sampleApps = [
      ["APP-2026-01", "2026-08-25", "عمر خالد فؤاد", "01099881122", "الجيزة", "الموقع الإلكتروني", "طلب جديد", "2026-09-02", "قيد الانتظار", "-", "إدارة المتطوعين", "خريج هندسة حاسبات يرغب في الدعم الفني"],
      ["APP-2026-02", "2026-08-26", "ياسمين أشرف كامل", "01144558877", "القاهرة", "صفحة الفيسبوك", "موعد مقابلة", "2026-09-03", "قيد المقابلة", "-", "أحمد محمود حسن", "مهتمة بتجهيز العرائس ومعارض الكساء"]
    ];
    appSheet.getRange(2, 1, sampleApps.length, sampleApps[0].length).setValues(sampleApps);
  }

  // سجل استعادة متطوعين قدامى
  const restSheet = ss.getSheetByName(APP_CONFIG.SHEETS.RESTORE);
  if (restSheet && restSheet.getLastRow() === 1) {
    const sampleRestore = [
      ["KAS-00005", "كريم حسام الدين عبد الرازق", "القليوبية", "2025-11-15", "ضغط العمل بالسلك القضائي والمحاماة", "أجواء العمل الجماعي وخدمة الأسر", "توفير مهام مسائية أو عن بعد", "التنظيم واللوجستيات", "الجمعة فقط", "نعم يرغب", "2026-08-20", "تم التواصل هاتفياً ورحب بالعودة لقافلة سبتمبر", "إرسال تكليف القافلة القادمة", "مسؤول إدارة المتطوعين", "تم الاتفاق على مشاركته يوم الجمعة فقط"]
    ];
    restSheet.getRange(2, 1, sampleRestore.length, sampleRestore[0].length).setValues(sampleRestore);
  }
}

/**
 * ==============================================================================
 * بناء وتحديث الـ Dashboard التفاعلي المؤسسي (Dashboard Engine)
 * ==============================================================================
 */
function refreshDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let dash = ss.getSheetByName(APP_CONFIG.SHEETS.DASHBOARD);
  if (!dash) {
    dash = ss.insertSheet(APP_CONFIG.SHEETS.DASHBOARD, 0);
  }
  dash.setRightToLeft(true);
  dash.clear();
dash.setHiddenGridlines(true);
  // حساب الإحصائيات الفعلية من واقع الجداول
  const stats = calculateSystemStatistics(ss);

  // 1. الهيدر الرئيسي المؤسسي
  dash.getRange("A1:M2").merge()
      .setValue("🏛️ " + APP_CONFIG.INSTITUTION_NAME + " - " + APP_CONFIG.SYSTEM_TITLE + " (الإصدار المؤسسي 2026)")
      .setBackground(APP_CONFIG.COLOR_PRIMARY)
      .setFontColor("#ffffff")
      .setFontSize(16)
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

  dash.getRange("A3:M3").merge()
      .setValue("📅 آخر تحديث تشغيلي شامل: " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm") + " | النظام متصل ويعمل بكفاءة عالية")
      .setBackground(APP_CONFIG.COLOR_SECONDARY)
      .setFontColor("#e2e8f0")
      .setFontSize(10)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

  // 2. بطاقات مؤشرات الأداء الرئيسية (KPI Cards)
  const kpis = [
    { title: "إجمالي المتطوعين", val: stats.totalVolunteers, col: "B", bg: "#1e3a8a" },
    { title: "المتطوعون النشطون", val: stats.activeVolunteers, col: "D", bg: "#065f46" },
    { title: "المتميزون والقيادات", val: stats.distinguished, col: "F", bg: "#854d0e" },
    { title: "إجمالي الساعات", val: stats.totalHours + " س", col: "H", bg: "#1e293b" },
    { title: "إجمالي النقاط", val: stats.totalPoints, col: "J", bg: "#581c87" },
    { title: "طلبات جديدة / قيد الفرز", val: stats.newApps, col: "L", bg: "#991b1b" }
  ];

  kpis.forEach(k => {
    const col1 = k.col;
    const col2 = String.fromCharCode(k.col.charCodeAt(0) + 1);
    
    // عنوان البطاقة
    dash.getRange(`${col1}5:${col2}5`).merge()
        .setValue(k.title)
        .setBackground(APP_CONFIG.COLOR_LIGHT)
        .setFontColor(APP_CONFIG.COLOR_PRIMARY)
        .setFontSize(10)
        .setFontWeight("bold")
        .setHorizontalAlignment("center");
        
    // قيمة البطاقة
    dash.getRange(`${col1}6:${col2}7`).merge()
        .setValue(k.val)
        .setBackground(k.bg)
        .setFontColor("#ffffff")
        .setFontSize(16)
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle");
  });

  // 3. جدول ملخص القيادات وتوزيع المحافظات السريع
  dash.getRange("B9:E9").merge().setValue("🏆 كشف قيادات الفرق والمحافظات").setBackground(APP_CONFIG.COLOR_PRIMARY).setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  dash.getRange("B10").setValue("كود القائد").setFontWeight("bold").setBackground("#e2e8f0");
  dash.getRange("C10").setValue("الاسم الرباعي").setFontWeight("bold").setBackground("#e2e8f0");
  dash.getRange("D10").setValue("المحافظة / الفريق").setFontWeight("bold").setBackground("#e2e8f0");
  dash.getRange("E10").setValue("المستوى القيادي").setFontWeight("bold").setBackground("#e2e8f0");

  let rIdx = 11;
  stats.leadersList.slice(0, 6).forEach(ldr => {
    dash.getRange(`B${rIdx}`).setValue(ldr.code);
    dash.getRange(`C${rIdx}`).setValue(ldr.name);
    dash.getRange(`D${rIdx}`).setValue(ldr.team);
    dash.getRange(`E${rIdx}`).setValue(ldr.level);
    rIdx++;
  });

  // 4. جدول إحصائيات المحافظات الأنشط
  dash.getRange("G9:L9").merge().setValue("🗺️ ترتيب المحافظات الأكثر مشاركة وساعات تطوع").setBackground(APP_CONFIG.COLOR_PRIMARY).setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center");
  dash.getRange("G10").setValue("المحافظة").setFontWeight("bold").setBackground("#e2e8f0");
  dash.getRange("H10").setValue("عدد المتطوعين").setFontWeight("bold").setBackground("#e2e8f0");
  dash.getRange("I10").setValue("المتطوعون النشطون").setFontWeight("bold").setBackground("#e2e8f0");
  dash.getRange("J10").setValue("إجمالي الساعات").setFontWeight("bold").setBackground("#e2e8f0");
  dash.getRange("K10").setValue("إجمالي النقاط").setFontWeight("bold").setBackground("#e2e8f0");
  dash.getRange("L10").setValue("متوسط التقييم").setFontWeight("bold").setBackground("#e2e8f0");

  let gIdx = 11;
  for (const gov in stats.govStats) {
    if (gIdx > 17) break;
    const g = stats.govStats[gov];
    dash.getRange(`G${gIdx}`).setValue(gov);
    dash.getRange(`H${gIdx}`).setValue(g.total);
    dash.getRange(`I${gIdx}`).setValue(g.active);
    dash.getRange(`J${gIdx}`).setValue(g.hours);
    dash.getRange(`K${gIdx}`).setValue(g.points);
    dash.getRange(`L${gIdx}`).setValue(g.count > 0 ? (g.sumRating / g.count).toFixed(2) : "-");
    gIdx++;
  }

  // تنسيق حدود الجدول
  dash.getRange("B9:E17").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);
  dash.getRange("G9:L17").setBorder(true, true, true, true, true, true, "#cbd5e1", SpreadsheetApp.BorderStyle.SOLID);

  // تحديث ورقة أفضل المتطوعين وترتيبهم تلقائياً
  updateBestVolunteersSheet(ss, stats.allVolunteersList);

  // تحديث التقارير الإحصائية المجمعة
  updateReportsSheet(ss, stats);
}

/**
 * حساب المؤشرات الإحصائية بأمان تام
 */
function calculateSystemStatistics(spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return {
    totalVolunteers: 0,
    activeVolunteers: 0,
    distinguished: 0,
    totalHours: 0,
    totalPoints: 0,
    newApps: 0,
    leadersList: [],
    govStats: {},
    allVolunteersList: []
  };

  const volSheet = ss.getSheetByName(APP_CONFIG.SHEETS.VOLUNTEERS);
  const appSheet = ss.getSheetByName(APP_CONFIG.SHEETS.APPLICATIONS);

  const stats = {
    totalVolunteers: 0,
    activeVolunteers: 0,
    distinguished: 0,
    totalHours: 0,
    totalPoints: 0,
    newApps: 0,
    leadersList: [],
    govStats: {},
    allVolunteersList: []
  };

  if (volSheet && volSheet.getLastRow() > 1) {
    const vMap = getHeaderMap(volSheet);
    const vData = volSheet.getRange(2, 1, volSheet.getLastRow() - 1, volSheet.getLastColumn()).getValues();

    stats.totalVolunteers = vData.length;

    vData.forEach(row => {
      const code = row[vMap["كود المتطوع"] - 1] || "";
      const name = row[vMap["الاسم رباعي"] - 1] || "";
      const gov = row[vMap["المحافظة"] - 1] || "غير محدد";
      const status = String(row[vMap["حالة المتطوع"] - 1] || "").trim();
      const level = String(row[vMap["مستوى المتطوع"] - 1] || "").trim();
      const team = row[vMap["الفريق"] - 1] || "";
      const hours = parseFloat(row[vMap["ساعات التطوع"] - 1]) || 0;
      const points = parseFloat(row[vMap["النقاط"] - 1]) || 0;
      const rating = parseFloat(row[vMap["متوسط التقييم"] - 1]) || 0;
      const convoys = parseInt(row[vMap["عدد القوافل"] - 1], 10) || 0;

      if (status === "نشط") stats.activeVolunteers++;
      if (level.includes("قائد") || level.includes("متميز") || level.includes("مسؤول")) stats.distinguished++;

      stats.totalHours += hours;
      stats.totalPoints += points;

      if (level.includes("قائد") || level.includes("مسؤول")) {
        stats.leadersList.push({ code, name, team: `${gov} - ${team}`, level });
      }

      if (!stats.govStats[gov]) {
        stats.govStats[gov] = { total: 0, active: 0, hours: 0, points: 0, sumRating: 0, count: 0 };
      }
      stats.govStats[gov].total++;
      if (status === "نشط") stats.govStats[gov].active++;
      stats.govStats[gov].hours += hours;
      stats.govStats[gov].points += points;
      if (rating > 0) {
        stats.govStats[gov].sumRating += rating;
        stats.govStats[gov].count++;
      }

      stats.allVolunteersList.push({
        code, name, gov, team, points, convoys, hours, rating, level
      });
    });
  }

  if (appSheet && appSheet.getLastRow() > 1) {
    const aMap = getHeaderMap(appSheet);
    const aData = appSheet.getRange(2, 1, appSheet.getLastRow() - 1, appSheet.getLastColumn()).getValues();
    aData.forEach(row => {
      const st = String(row[aMap["حالة الطلب"] - 1] || "").trim();
      if (st === "طلب جديد" || st === "تحت المراجعة") stats.newApps++;
    });
  }

  return stats;
}

/**
 * تحديث ترتيب صفحة أفضل المتطوعين بأمان تام
 */
function updateBestVolunteersSheet(spreadsheet, list) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  const bestSheet = ss.getSheetByName(APP_CONFIG.SHEETS.BEST);
  if (!bestSheet) return;

  if (bestSheet.getLastRow() > 1) {
    bestSheet.getRange(2, 1, bestSheet.getLastRow() - 1, bestSheet.getLastColumn()).clearContent();
  }

  // إذا تم تشغيل الدالة بمفردها ولم يتم تمرير قائمة، نقوم بحسابها تلقائياً
  let volunteersList = list;
  if (!volunteersList) {
    const stats = calculateSystemStatistics(ss);
    volunteersList = stats.allVolunteersList;
  }

  volunteersList.sort((a, b) => b.points - a.points || b.hours - a.hours || b.rating - a.rating);

  const topRows = [];
  volunteersList.slice(0, 50).forEach((v, idx) => {
    topRows.push([
      idx + 1, v.code, v.name, v.gov, v.team, v.points, v.convoys, v.hours, v.rating, v.level
    ]);
  });

  if (topRows.length > 0) {
    bestSheet.getRange(2, 1, topRows.length, topRows[0].length).setValues(topRows);
    bestSheet.getRange(2, 1, topRows.length, topRows[0].length).setHorizontalAlignment("center");
  }
}

/**
 * تحديث صفحة التقارير بأمان تام
 */
function updateReportsSheet(spreadsheet, statsData) {
  const ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  const repSheet = ss.getSheetByName(APP_CONFIG.SHEETS.REPORTS);
  if (!repSheet) return;

  if (repSheet.getLastRow() > 1) {
    repSheet.getRange(2, 1, repSheet.getLastRow() - 1, repSheet.getLastColumn()).clearContent();
  }

  const stats = statsData || calculateSystemStatistics(ss);

  const reportsData = [
    ["إجمالي قاعدة بيانات المتطوعين", stats.totalVolunteers, "مسجلون رسمياً في النظام"],
    ["المتطوعون النشطون فعلياً", stats.activeVolunteers, "شاركوا خلال آخر 60 يوماً"],
    ["المتطوعون المتميزون والقيادات", stats.distinguished, "قادة قوافل، فرق، ومحافظات"],
    ["إجمالي ساعات التطوع المنفذة", stats.totalHours, "ساعة عمل ميداني ومكتبي وتخطيط"],
    ["إجمالي الرصيد التراكمي للنقاط", stats.totalPoints, "محسوبة وفق معايير اللائحة"],
    ["طلبات التطوع الجديدة قيد الإجراء", stats.newApps, "بانتظار المقابلات والتسكين"]
  ];

  repSheet.getRange(2, 1, reportsData.length, reportsData[0].length).setValues(reportsData);
  repSheet.getRange(2, 1, reportsData.length, reportsData[0].length).setHorizontalAlignment("center");
}
/**
 * ==============================================================================
 * دوال معالجة العمليات (Backend APIs) المرتبطة بواجهات الـ HTML
 * ==============================================================================
 */

/**
 * جلب خيارات القوائم المنسدلة من صفحة الإعدادات للواجهات
 */
function getSettingsOptions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const setSheet = ss.getSheetByName(APP_CONFIG.SHEETS.SETTINGS);
  const options = {
    governorates: [],
    statuses: [],
    levels: [],
    taskTypes: [],
    rewardTypes: [],
    teams: []
  };

  if (!setSheet || setSheet.getLastRow() <= 1) return options;

  const data = setSheet.getRange(2, 1, setSheet.getLastRow() - 1, 10).getValues();
  data.forEach(row => {
    if (row[0]) options.governorates.push(String(row[0]).trim());
    if (row[1]) options.statuses.push(String(row[1]).trim());
    if (row[2]) options.levels.push(String(row[2]).trim());
    if (row[3]) options.taskTypes.push(String(row[3]).trim());
    if (row[6]) options.rewardTypes.push(String(row[6]).trim());
    if (row[8]) options.teams.push(String(row[8]).trim());
  });

  return options;
}

/**
 * 1. إضافة متطوع جديد مع توليد الكود التسلسلي آلياً
 */
function addVolunteer(form) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.VOLUNTEERS);
    if (!sheet) throw new Error("ورقة المتطوعين غير موجودة");

    const vMap = getHeaderMap(sheet);
    const lastRow = sheet.getLastRow();

    // توليد الكود KAS-XXXXX
    let nextNum = 1;
    if (lastRow > 1) {
      const codes = sheet.getRange(2, vMap["كود المتطوع"], lastRow - 1, 1).getValues();
      codes.forEach(c => {
        const val = String(c[0]).trim();
        if (val.startsWith("KAS-")) {
          const n = parseInt(val.replace("KAS-", ""), 10);
          if (!isNaN(n) && n >= nextNum) nextNum = n + 1;
        }
      });
    }
    const newCode = `KAS-${String(nextNum).padStart(5, '0')}`;
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    // بناء الصف المتوافق مع خريطة الأعمدة
    const newRow = new Array(sheet.getLastColumn()).fill("");
    newRow[vMap["كود المتطوع"] - 1] = newCode;
    newRow[vMap["تاريخ التسجيل"] - 1] = today;
    newRow[vMap["الاسم رباعي"] - 1] = form.name || "";
    newRow[vMap["الرقم القومي"] - 1] = form.nationalId || "";
    newRow[vMap["تاريخ الميلاد"] - 1] = form.dob || "";
    newRow[vMap["السن"] - 1] = form.age || "";
    newRow[vMap["الجنسية"] - 1] = form.nationality || "مصري";
    newRow[vMap["المحافظة"] - 1] = form.gov || "";
    newRow[vMap["المركز / المدينة"] - 1] = form.city || "";
    newRow[vMap["العنوان"] - 1] = form.address || "";
    newRow[vMap["الهاتف"] - 1] = form.phone || "";
    newRow[vMap["واتساب"] - 1] = form.whatsapp || form.phone || "";
    newRow[vMap["البريد الإلكتروني"] - 1] = form.email || "";
    newRow[vMap["المؤهل"] - 1] = form.qualification || "";
    newRow[vMap["الكلية / التخصص"] - 1] = form.major || "";
    newRow[vMap["المهنة"] - 1] = form.job || "";
    newRow[vMap["المهارات"] - 1] = form.skills || "";
    newRow[vMap["المجالات المفضلة"] - 1] = form.fields || "";
    newRow[vMap["حالة المتطوع"] - 1] = form.status || "نشط";
    newRow[vMap["مستوى المتطوع"] - 1] = form.level || "متطوع جديد";
    newRow[vMap["الفريق"] - 1] = form.team || "";
    newRow[vMap["عدد القوافل"] - 1] = 0;
    newRow[vMap["ساعات التطوع"] - 1] = 0;
    newRow[vMap["متوسط التقييم"] - 1] = 5.0;
    newRow[vMap["النقاط"] - 1] = 50; // هدية تسجيل
    newRow[vMap["المكافآت"] - 1] = 0;
    newRow[vMap["آخر تواصل"] - 1] = today;
    newRow[vMap["ملاحظات"] - 1] = form.notes || "";

    sheet.appendRow(newRow);
    refreshDashboard();
    return { success: true, message: `تمت إضافة المتطوع بنجاح بالكود: ${newCode}`, code: newCode };
  } catch (err) {
    return { success: false, message: `فشلت العملية: ${err.message}` };
  }
}

/**
 * 2. البحث الشامل في قاعدة بيانات المتطوعين
 */
function searchVolunteer(query) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.VOLUNTEERS);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const vMap = getHeaderMap(sheet);
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const q = String(query).toLowerCase().trim();

  const results = [];
  data.forEach(r => {
    const code = String(r[vMap["كود المتطوع"] - 1] || "");
    const name = String(r[vMap["الاسم رباعي"] - 1] || "");
    const phone = String(r[vMap["الهاتف"] - 1] || "");
    const nationalId = String(r[vMap["الرقم القومي"] - 1] || "");
    const gov = String(r[vMap["المحافظة"] - 1] || "");
    const team = String(r[vMap["الفريق"] - 1] || "");
    const status = String(r[vMap["حالة المتطوع"] - 1] || "");
    const level = String(r[vMap["مستوى المتطوع"] - 1] || "");

    if (code.toLowerCase().includes(q) || name.toLowerCase().includes(q) || phone.includes(q) || nationalId.includes(q) || gov.toLowerCase().includes(q) || team.toLowerCase().includes(q)) {
      results.push({
        code, name, phone, gov, team, status, level,
        points: r[vMap["النقاط"] - 1] || 0,
        hours: r[vMap["ساعات التطوع"] - 1] || 0,
        rating: r[vMap["متوسط التقييم"] - 1] || 0
      });
    }
  });

  return results;
}

/**
 * 3. جلب ملف المتطوع الشامل مع سجل النشاط الكامل
 */
function getVolunteerProfileData(volunteerCode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const volSheet = ss.getSheetByName(APP_CONFIG.SHEETS.VOLUNTEERS);
  const attSheet = ss.getSheetByName(APP_CONFIG.SHEETS.ATTENDANCE);
  const rewSheet = ss.getSheetByName(APP_CONFIG.SHEETS.REWARDS);

  if (!volSheet || volSheet.getLastRow() <= 1) return null;

  const vMap = getHeaderMap(volSheet);
  const vData = volSheet.getRange(2, 1, volSheet.getLastRow() - 1, volSheet.getLastColumn()).getValues();
  const target = vData.find(r => String(r[vMap["كود المتطوع"] - 1]).toLowerCase().trim() === String(volunteerCode).toLowerCase().trim());

  if (!target) return null;

  const profile = {
    code: target[vMap["كود المتطوع"] - 1],
    regDate: target[vMap["تاريخ التسجيل"] - 1],
    name: target[vMap["الاسم رباعي"] - 1],
    nationalId: target[vMap["الرقم القومي"] - 1],
    phone: target[vMap["الهاتف"] - 1],
    gov: target[vMap["المحافظة"] - 1],
    city: target[vMap["المركز / المدينة"] - 1],
    team: target[vMap["الفريق"] - 1],
    status: target[vMap["حالة المتطوع"] - 1],
    level: target[vMap["مستوى المتطوع"] - 1],
    qualification: target[vMap["المؤهل"] - 1],
    skills: target[vMap["المهارات"] - 1],
    hours: target[vMap["ساعات التطوع"] - 1] || 0,
    points: target[vMap["النقاط"] - 1] || 0,
    rating: target[vMap["متوسط التقييم"] - 1] || 0,
    convoys: target[vMap["عدد القوافل"] - 1] || 0,
    lastDate: target[vMap["آخر مشاركة"] - 1] || "-",
    timeline: []
  };

  // جلب سجل الحضور
  if (attSheet && attSheet.getLastRow() > 1) {
    const aMap = getHeaderMap(attSheet);
    const aData = attSheet.getRange(2, 1, attSheet.getLastRow() - 1, attSheet.getLastColumn()).getValues();
    aData.forEach(r => {
      if (String(r[aMap["كود المتطوع"] - 1]).toLowerCase().trim() === String(volunteerCode).toLowerCase().trim()) {
        profile.timeline.push({
          type: "مشاركة وحضور",
          title: r[aMap["القافلة / النشاط"] - 1],
          date: r[aMap["التاريخ"] - 1],
          details: `${r[aMap["عدد الساعات"] - 1]} ساعة - ${r[aMap["الملاحظات"] - 1] || ""}`
        });
      }
    });
  }

  // جلب سجل المكافآت
  if (rewSheet && rewSheet.getLastRow() > 1) {
    const rMap = getHeaderMap(rewSheet);
    const rData = rewSheet.getRange(2, 1, rewSheet.getLastRow() - 1, rewSheet.getLastColumn()).getValues();
    rData.forEach(r => {
      if (String(r[rMap["كود المتطوع"] - 1]).toLowerCase().trim() === String(volunteerCode).toLowerCase().trim()) {
        profile.timeline.push({
          type: "تقدير ومكافأة",
          title: r[rMap["نوع التقدير"] - 1],
          date: r[rMap["التاريخ"] - 1],
          details: `السبب: ${r[rMap["سبب الاستحقاق"] - 1]} (+${r[rMap["النقاط"] - 1]} نقطة)`
        });
      }
    });
  }

  return profile;
}

/**
 * 4. إضافة تكليف جديد
 */
function addAssignment(form) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.ASSIGNMENTS);
    if (!sheet) throw new Error("ورقة التكليفات غير موجودة");

    const aMap = getHeaderMap(sheet);
    const code = `TSK-${Date.now().toString().slice(-6)}`;
    const today = form.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    const newRow = new Array(sheet.getLastColumn()).fill("");
    newRow[aMap["رقم التكليف"] - 1] = code;
    newRow[aMap["كود المتطوع"] - 1] = form.volCode || "";
    newRow[aMap["اسم المتطوع"] - 1] = form.volName || "";
    newRow[aMap["القافلة / النشاط"] - 1] = form.taskName || "";
    newRow[aMap["نوع المهمة"] - 1] = form.taskType || "";
    newRow[aMap["المحافظة"] - 1] = form.gov || "";
    newRow[aMap["التاريخ"] - 1] = today;
    newRow[aMap["الدور"] - 1] = form.role || "";
    newRow[aMap["المسؤول المباشر"] - 1] = form.supervisor || "";
    newRow[aMap["حالة المهمة"] - 1] = "قيد التنفيذ";
    newRow[aMap["الملاحظات"] - 1] = form.notes || "";

    sheet.appendRow(newRow);
    return { success: true, message: `تم تسجيل التكليف برقم: ${code}` };
  } catch (err) {
    return { success: false, message: `فشل التكليف: ${err.message}` };
  }
}

/**
 * 5. تسجيل الحضور واحتساب النقاط والساعات وتحديث المتطوع آلياً
 */
function recordAttendance(form) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const attSheet = ss.getSheetByName(APP_CONFIG.SHEETS.ATTENDANCE);
    const volSheet = ss.getSheetByName(APP_CONFIG.SHEETS.VOLUNTEERS);
    if (!attSheet || !volSheet) throw new Error("أوراق العمل غير مهيأة");

    const aMap = getHeaderMap(attSheet);
    const vMap = getHeaderMap(volSheet);
    const hours = parseFloat(form.hours) || 0;
    const earnedPoints = hours * 10; // قاعدة: كل ساعة بـ 10 نقاط
    const attId = `ATT-${Date.now().toString().slice(-6)}`;
    const today = form.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    // 1. إضافة صف الحضور
    const newAttRow = new Array(attSheet.getLastColumn()).fill("");
    newAttRow[aMap["رقم السجل"] - 1] = attId;
    newAttRow[aMap["كود المتطوع"] - 1] = form.volCode;
    newAttRow[aMap["الاسم"] - 1] = form.volName || "";
    newAttRow[aMap["القافلة / النشاط"] - 1] = form.activity || "";
    newAttRow[aMap["المحافظة"] - 1] = form.gov || "";
    newAttRow[aMap["التاريخ"] - 1] = today;
    newAttRow[aMap["حالة الحضور"] - 1] = form.status || "حاضر";
    newAttRow[aMap["عدد الساعات"] - 1] = hours;
    newAttRow[aMap["النقاط المكتسبة"] - 1] = earnedPoints;
    newAttRow[aMap["الملاحظات"] - 1] = form.notes || "";

    attSheet.appendRow(newAttRow);

    // 2. تحديث ساعات ونقاط المتطوع في ورقة المتطوعين
    const vData = volSheet.getRange(2, 1, volSheet.getLastRow() - 1, volSheet.getLastColumn()).getValues();
    for (let i = 0; i < vData.length; i++) {
      if (String(vData[i][vMap["كود المتطوع"] - 1]).toLowerCase().trim() === String(form.volCode).toLowerCase().trim()) {
        const rowNum = i + 2;
        const currentHours = parseFloat(vData[i][vMap["ساعات التطوع"] - 1]) || 0;
        const currentPoints = parseFloat(vData[i][vMap["النقاط"] - 1]) || 0;
        const currentConvoys = parseInt(vData[i][vMap["عدد القوافل"] - 1], 10) || 0;

        volSheet.getRange(rowNum, vMap["ساعات التطوع"]).setValue(currentHours + hours);
        volSheet.getRange(rowNum, vMap["النقاط"]).setValue(currentPoints + earnedPoints);
        volSheet.getRange(rowNum, vMap["عدد القوافل"]).setValue(currentConvoys + 1);
        volSheet.getRange(rowNum, vMap["آخر مشاركة"]).setValue(today);
        volSheet.getRange(rowNum, vMap["حالة المتطوع"]).setValue("نشط");
        break;
      }
    }

    refreshDashboard();
    return { success: true, message: `تم تسجيل الحضور بنجاح للمتطوع ${form.volName || form.volCode} (+${earnedPoints} نقطة)` };
  } catch (err) {
    return { success: false, message: `فشل تسجيل الحضور: ${err.message}` };
  }
}

/**
 * 6. تقييم متطوع وتحديث متوسط تقييمه
 */
function evaluateVolunteer(form) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const evalSheet = ss.getSheetByName(APP_CONFIG.SHEETS.EVALUATION);
    const volSheet = ss.getSheetByName(APP_CONFIG.SHEETS.VOLUNTEERS);
    if (!evalSheet || !volSheet) throw new Error("أوراق العمل غير مهيأة");

    const eMap = getHeaderMap(evalSheet);
    const vMap = getHeaderMap(volSheet);
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    const score1 = parseFloat(form.commitment) || 5;
    const score2 = parseFloat(form.teamwork) || 5;
    const score3 = parseFloat(form.initiative) || 5;
    const score4 = parseFloat(form.beneficiaryDealing) || 5;
    const avgScore = ((score1 + score2 + score3 + score4) / 4).toFixed(2);

    const newRow = new Array(evalSheet.getLastColumn()).fill("");
    newRow[eMap["كود المتطوع"] - 1] = form.volCode;
    newRow[eMap["اسم المتطوع"] - 1] = form.volName || "";
    newRow[eMap["تاريخ التقييم"] - 1] = today;
    newRow[eMap["الالتزام"] - 1] = score1;
    newRow[eMap["التعاون"] - 1] = score2;
    newRow[eMap["المبادرة"] - 1] = score3;
    newRow[eMap["السلوك مع المستفيدين"] - 1] = score4;
    newRow[eMap["النتيجة"] - 1] = avgScore;
    newRow[eMap["الملاحظات"] - 1] = form.notes || "";
    newRow[eMap["التوصية"] - 1] = form.recommendation || "";

    evalSheet.appendRow(newRow);

    // تحديث المتوسط في شيت المتطوعين
    const vData = volSheet.getRange(2, 1, volSheet.getLastRow() - 1, volSheet.getLastColumn()).getValues();
    for (let i = 0; i < vData.length; i++) {
      if (String(vData[i][vMap["كود المتطوع"] - 1]).toLowerCase().trim() === String(form.volCode).toLowerCase().trim()) {
        const rowNum = i + 2;
        volSheet.getRange(rowNum, vMap["متوسط التقييم"]).setValue(avgScore);
        break;
      }
    }

    refreshDashboard();
    return { success: true, message: `تم تسجيل التقييم بنتيجة (${avgScore} / 5) بنجاح!` };
  } catch (err) {
    return { success: false, message: `فشل حفظ التقييم: ${err.message}` };
  }
}

/**
 * 7. تسجيل مكافأة أو تقدير
 */
function addReward(form) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rewSheet = ss.getSheetByName(APP_CONFIG.SHEETS.REWARDS);
    const volSheet = ss.getSheetByName(APP_CONFIG.SHEETS.VOLUNTEERS);
    if (!rewSheet || !volSheet) throw new Error("أوراق العمل غير مهيأة");

    const rMap = getHeaderMap(rewSheet);
    const vMap = getHeaderMap(volSheet);
    const points = parseFloat(form.points) || 50;
    const today = form.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    const newRow = new Array(rewSheet.getLastColumn()).fill("");
    newRow[rMap["كود المتطوع"] - 1] = form.volCode;
    newRow[rMap["اسم المتطوع"] - 1] = form.volName || "";
    newRow[rMap["التاريخ"] - 1] = today;
    newRow[rMap["نوع التقدير"] - 1] = form.rewardType || "";
    newRow[rMap["سبب الاستحقاق"] - 1] = form.reason || "";
    newRow[rMap["النقاط"] - 1] = points;
    newRow[rMap["المعتمد"] - 1] = form.approvedBy || "إدارة الجمعية";
    newRow[rMap["حالة التنفيذ"] - 1] = "تم التسليم";
    newRow[rMap["الملاحظات"] - 1] = form.notes || "";

    rewSheet.appendRow(newRow);

    // إضافة النقاط للمتطوع
    const vData = volSheet.getRange(2, 1, volSheet.getLastRow() - 1, volSheet.getLastColumn()).getValues();
    for (let i = 0; i < vData.length; i++) {
      if (String(vData[i][vMap["كود المتطوع"] - 1]).toLowerCase().trim() === String(form.volCode).toLowerCase().trim()) {
        const rowNum = i + 2;
        const currentPoints = parseFloat(vData[i][vMap["النقاط"] - 1]) || 0;
        const currentRewards = parseInt(vData[i][vMap["المكافآت"] - 1], 10) || 0;
        volSheet.getRange(rowNum, vMap["النقاط"]).setValue(currentPoints + points);
        volSheet.getRange(rowNum, vMap["المكافآت"]).setValue(currentRewards + 1);
        break;
      }
    }

    refreshDashboard();
    return { success: true, message: `تم منح التقدير وإضافة ${points} نقطة بنجاح!` };
  } catch (err) {
    return { success: false, message: `فشل تسجيل التقدير: ${err.message}` };
  }
}

/**
 * 8. تسجيل متابعة استعادة متطوع قديم
 */
function restoreVolunteer(form) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(APP_CONFIG.SHEETS.RESTORE);
    if (!sheet) throw new Error("ورقة الاستعادة غير موجودة");

    const rMap = getHeaderMap(sheet);
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

    const newRow = new Array(sheet.getLastColumn()).fill("");
    newRow[rMap["كود المتطوع"] - 1] = form.volCode;
    newRow[rMap["اسم المتطوع"] - 1] = form.volName || "";
    newRow[rMap["المحافظة"] - 1] = form.gov || "";
    newRow[rMap["آخر مشاركة"] - 1] = form.lastActive || "-";
    newRow[rMap["سبب الابتعاد"] - 1] = form.reason || "";
    newRow[rMap["ما كان يحفزه"] - 1] = form.motivator || "";
    newRow[rMap["ما يشجعه على العودة"] - 1] = form.returnIncentive || "";
    newRow[rMap["المجال المفضل"] - 1] = form.field || "";
    newRow[rMap["الوقت المتاح"] - 1] = form.availableTime || "";
    newRow[rMap["هل يرغب في العودة؟"] - 1] = form.wantsReturn || "نعم";
    newRow[rMap["آخر تواصل"] - 1] = today;
    newRow[rMap["نتيجة التواصل"] - 1] = form.result || "";
    newRow[rMap["الإجراء التالي"] - 1] = form.nextStep || "";
    newRow[rMap["مسؤول المتابعة"] - 1] = form.followupOfficer || "";
    newRow[rMap["الملاحظات"] - 1] = form.notes || "";

    sheet.appendRow(newRow);
    return { success: true, message: "تم تسجيل متابعة الاستعادة بنجاح" };
  } catch (err) {
    return { success: false, message: `فشلت العملية: ${err.message}` };
  }
}

/**
 * ==============================================================================
 * دوال فتح واجهات الـ HTML (Sidebar & Modal Dialogs)
 * ==============================================================================
 */
function openAddVolunteerModal() {
  const html = HtmlService.createTemplateFromFile('AddVolunteerModal').evaluate()
      .setWidth(750).setHeight(600).setTitle('👤 إضافة متطوع جديد - جمعية خواطر أحلى شباب');
  SpreadsheetApp.getUi().showModalDialog(html, '👤 إضافة متطوع جديد');
}

function openSearchVolunteerModal() {
  const html = HtmlService.createTemplateFromFile('SearchVolunteerModal').evaluate()
      .setWidth(850).setHeight(620).setTitle('🔎 البحث الشامل عن متطوع');
  SpreadsheetApp.getUi().showModalDialog(html, '🔎 البحث عن متطوع');
}

function openVolunteerProfileModal(code) {
  const template = HtmlService.createTemplateFromFile('VolunteerProfileModal');
  template.targetCode = code;
  const html = template.evaluate().setWidth(800).setHeight(650).setTitle('📁 ملف المتطوع الكامل');
  SpreadsheetApp.getUi().showModalDialog(html, '📁 ملف المتطوع');
}

function openAssignmentModal() {
  const html = HtmlService.createTemplateFromFile('AssignmentModal').evaluate()
      .setWidth(600).setHeight(520).setTitle('📌 تكليف بمهمة / قافلة');
  SpreadsheetApp.getUi().showModalDialog(html, '📌 تكليف بمهمة');
}

function openAttendanceModal() {
  const html = HtmlService.createTemplateFromFile('AttendanceModal').evaluate()
      .setWidth(550).setHeight(520).setTitle('⚡ تسجيل حضور ومشاركة');
  SpreadsheetApp.getUi().showModalDialog(html, '⚡ تسجيل حضور');
}

function openEvaluationModal() {
  const html = HtmlService.createTemplateFromFile('EvaluationModal').evaluate()
      .setWidth(600).setHeight(560).setTitle('⭐ تقييم متطوع');
  SpreadsheetApp.getUi().showModalDialog(html, '⭐ تقييم متطوع');
}

function openRewardModal() {
  const html = HtmlService.createTemplateFromFile('RewardModal').evaluate()
      .setWidth(550).setHeight(480).setTitle('🏅 تسجيل مكافأة وتقدير');
  SpreadsheetApp.getUi().showModalDialog(html, '🏅 تسجيل مكافأة');
}

function openRestoreModal() {
  const html = HtmlService.createTemplateFromFile('RestoreModal').evaluate()
      .setWidth(650).setHeight(580).setTitle('🔄 متابعة استعادة متطوع قديم');
  SpreadsheetApp.getUi().showModalDialog(html, '🔄 استعادة متطوع قديم');
}