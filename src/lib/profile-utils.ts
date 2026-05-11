export const PALESTINIAN_CITIES = [
  "رام الله",
  "القدس",
  "نابلس",
  "الخليل",
  "بيت لحم",
  "جنين",
  "طولكرم",
  "قلقيلية",
  "أريحا",
  "سلفيت",
  "طوباس",
  "غزة",
  "خان يونس",
  "رفح",
  "دير البلح",
  "أخرى"
];

export const JOB_KEYWORDS: Record<string, string[]> = {
  "طاهي/ة": ["تحضير الطعام", "سلامة الغذاء", "تطوير قوائم الطعام", "إدارة المطبخ", "العمل تحت الضغط", "الطبخ السريع", "معرفة بالمقادير", "النظافة العامة"],
  "نادل/ة": ["خدمة الزبائن", "تقديم الطعام", "التواصل الفعال", "حل المشكلات", "استقبال الطلبات", "معرفة بقائمة الطعام", "الصبر", "العمل بروح الفريق"],
  "باريستا": ["فن اللاتيه (Latte Art)", "إعداد القهوة", "خدمة الزبائن", "إدارة الوقت", "صيانة المعدات", "معرفة بأنواع البن", "العمل السريع"],
  "كاشير": ["إدارة المدفوعات", "التعامل مع النقود", "خدمة الزبائن", "الدقة والتركيز", "برامج نقاط البيع (POS)", "إعداد التقارير اليومية"],
  "مدير": ["إدارة الفريق", "حل المشكلات", "التخطيط الاستراتيجي", "خدمة العملاء", "التحكم بالتكاليف", "تدريب الموظفين", "ضمان الجودة"],
  "توصيل": ["القيادة الآمنة", "معرفة بالطرق", "الالتزام بالوقت", "خدمة الزبائن", "الحفاظ على سلامة الطلب"],
  "مضيف/ة": ["استقبال الزبائن", "إدارة الحجوزات", "التواصل الفعال", "المظهر اللائق", "تنظيم الطاولات", "إدارة أوقات الانتظار"],
  "أخرى": ["العمل بروح الفريق", "التواصل الفعال", "القدرة على التعلم", "الالتزام", "المرونة"]
};

export function getSuggestedKeywords(jobTitle: string | undefined | null): string[] {
  if (!jobTitle) return JOB_KEYWORDS["أخرى"];
  
  // Find the exact match or return "أخرى"
  const match = Object.keys(JOB_KEYWORDS).find(key => jobTitle.includes(key) || key.includes(jobTitle));
  if (match) {
    return JOB_KEYWORDS[match];
  }
  
  return JOB_KEYWORDS["أخرى"];
}

/**
 * Calculates the profile completion percentage.
 * Total profile fields = 90%
 * CV = 10%
 * Returns an object with the total percentage and whether CV is uploaded.
 */
export function calculateProfileCompletion(profile: any, seekerProfile: any) {
  const coreFields = [
    !!profile?.full_name,
    !!profile?.phone,
    !!profile?.location,
    !!seekerProfile?.job_title,
    !!(seekerProfile?.experience_years !== null && seekerProfile?.experience_years !== undefined),
    !!(seekerProfile?.skills && seekerProfile.skills.length > 0), // skills are the keywords now
    !!seekerProfile?.bio,
  ];

  const completedCoreFields = coreFields.filter(Boolean).length;
  // 90% distributed over 7 core fields (~12.85% each)
  const corePercentage = Math.round((completedCoreFields / coreFields.length) * 90);

  const hasCV = !!(seekerProfile?.cv_url || (seekerProfile?.resume_data && Object.keys(seekerProfile.resume_data).length > 0));
  
  const cvPercentage = hasCV ? 10 : 0;
  
  const totalPercentage = corePercentage + cvPercentage;

  return {
    completionPercent: totalPercentage > 100 ? 100 : totalPercentage,
    hasCV,
    coreCompleted: completedCoreFields === coreFields.length
  };
}
