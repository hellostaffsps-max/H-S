const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lwfmnngfmnnoydpcnuox.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Zm1ubmdmbW5ub3lkcGNudW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk3NTM1NSwiZXhwIjoyMDkzNTUxMzU1fQ.nT51tZgu3g7k5S_5PMbl8OGcMjyPwx-HdjyT4oWwNoQ',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const JOBS = [
  { email: 'demo.burj@hellostaff.ps', company_name: 'مقهى البرج', title: 'باريستا خبرة', category: 'باريستا', type: 'دوام كامل', location: 'رام الله - شارع ركب', experience_level: 'سنتان', description: 'نبحث عن باريستا ذو خبرة لا تقل عن سنتين في تحضير القهوة المختصة واللاتيه آرت. العمل في أجواء شبابية ومهنية. الراتب يبدأ من 3500 شيكل + بونص شهري.', salary_min: 3500, salary_max: 4500, currency: 'ILS', whatsapp_number: '+970599123456' },
  { email: 'demo.burj@hellostaff.ps', company_name: 'مقهى البرج', title: 'نادل/ة', category: 'نادل/ة', type: 'دوام جزئي', location: 'رام الله - شارع ركب', experience_level: 'بدون خبرة', description: 'فرصة عمل للنادلين الجدد في أجواء ودية. تدريب مجاني على رأس العمل. دوام مسائي من 4 مساءً حتى 12 ليلاً. الراتب 2500 شيكل.', salary_min: 2500, salary_max: 2500, currency: 'ILS', whatsapp_number: '+970599123456' },
  { email: 'demo.zaytouna@hellostaff.ps', company_name: 'مطعم زيتونة', title: 'طاهي/ة مساعد', category: 'طاهي/ة', type: 'دوام كامل', location: 'نابلس - البلدة القديمة', experience_level: '1-3 سنوات', description: 'مطلوب طاهي مساعد ذو خبرة في المطبخ الفلسطيني. العمل 6 أيام في الأسبوع. يفضّل من سكان نابلس والمناطق المحيطة. الراتب 4000 شيكل + وجبات.', salary_min: 4000, salary_max: 5000, currency: 'ILS', whatsapp_number: '+970599234567' },
  { email: 'demo.zaytouna@hellostaff.ps', company_name: 'مطعم زيتونة', title: 'كاشير', category: 'كاشير', type: 'دوام كامل', location: 'نابلس - البلدة القديمة', experience_level: 'سنة واحدة', description: 'مطلوب كاشير ذو خبرة في التعامل مع برامج نقاط البيع. مهارات تواصل جيدة وابتسامة دائمة. الراتب 3000 شيكل.', salary_min: 3000, salary_max: 3200, currency: 'ILS', whatsapp_number: '+970599234567' },
  { email: 'demo.karmel@hellostaff.ps', company_name: 'فندق الكرمل', title: 'مضيف/ة استقبال', category: 'مضيف/ة', type: 'دوام كامل', location: 'بيت لحم - شارع النجمة', experience_level: '3+ سنوات', description: 'مطلوب موظف/ة استقبال للعمل في فندق ثلاث نجوم. يجب إتقان اللغتين العربية والإنجليزية. خبرة في برامج الحجز الفندقي. الراتب 4500 شيكل + تيبس.', salary_min: 4500, salary_max: 5500, currency: 'ILS', whatsapp_number: '+970599345678' },
  { email: 'demo.karmel@hellostaff.ps', company_name: 'فندق الكرمل', title: 'طاهي/ة رئيسي', category: 'طاهي/ة', type: 'دوام كامل', location: 'بيت لحم - شارع النجمة', experience_level: '5+ سنوات', description: 'مطلوب شيف رئيسي ذو خبرة واسعة في المطبخ الدولي والمحلي. قدرة على إدارة فريق المطبخ والتحكم في التكاليف. الراتب يبدأ من 6000 شيكل.', salary_min: 6000, salary_max: 8000, currency: 'ILS', whatsapp_number: '+970599345678' },
  { email: 'demo.shawaya@hellostaff.ps', company_name: 'مطعم الشواية', title: 'مساعد مطبخ', category: 'طاهي/ة', type: 'دوام كامل', location: 'رام الله - المنطقة الصناعية', experience_level: 'بدون خبرة', description: 'فرصة للشباب الجادين للدخول في مجال المطاعم. تدريب مجاني على رأس العمل في قسم التحضير والتقطيع. الراتب 2800 شيكل + وجبات يومية.', salary_min: 2800, salary_max: 3000, currency: 'ILS', whatsapp_number: '+970599456789' },
  { email: 'demo.shawaya@hellostaff.ps', company_name: 'مطعم الشواية', title: 'مدير مطعم', category: 'مدير', type: 'دوام كامل', location: 'رام الله - المنطقة الصناعية', experience_level: '3+ سنوات', description: 'مطلوب مدير مطعم ذو خبرة في إدارة فرق العمل والمخزون وجودة الخدمة. مهارات قيادية وقدرة على اتخاذ القرار. الراتب 5000 شيكل + بونص أداء.', salary_min: 5000, salary_max: 6500, currency: 'ILS', whatsapp_number: '+970599456789' },
  { email: 'demo.diwan@hellostaff.ps', company_name: 'مقهى ديوان', title: 'باريستا', category: 'باريستا', type: 'دوام جزئي', location: 'الخليل - مركز المدينة', experience_level: 'سنة واحدة', description: 'مطلوب باريستا للعمل في مقهى ثقافي. خبرة في V60 وإسبريسو واللاتيه آرت. العمل أيام الجمعة والسبت بشكل رئيسي. الراتب 2000 شيكل.', salary_min: 2000, salary_max: 2500, currency: 'ILS', whatsapp_number: '+970599567890' },
  { email: 'demo.diwan@hellostaff.ps', company_name: 'مقهى ديوان', title: 'توصيل طلبات', category: 'توصيل', type: 'دوام جزئي', location: 'الخليل - مركز المدينة', experience_level: 'بدون خبرة', description: 'مطلوب موظف توصيل طلبات بدراجة نارية أو سيارة شخصية. يجب امتلاك رخصة قيادة سارية. العمل مساءً فقط. الراتب بالعمولة + بدل بنزين.', salary_min: 1500, salary_max: 3000, currency: 'ILS', whatsapp_number: '+970599567890' },
];

async function seed() {
  console.log('🌱 Seeding jobs only...\n');
  let jobsCreated = 0;

  // Build email -> profile_id map
  const { data: profiles } = await supabase.from('profiles').select('id, email').eq('role', 'employer');
  const emailToId = {};
  profiles?.forEach(p => { emailToId[p.email] = p.id; });

  for (const job of JOBS) {
    const userId = emailToId[job.email];
    if (!userId) {
      console.log('  ❌ No profile found for', job.email);
      continue;
    }

    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('employer_id', userId)
      .eq('title', job.title)
      .single();

    if (existingJob) {
      console.log('  ⏭️  Job "' + job.title + '" already exists');
      continue;
    }

    const { error: jobError } = await supabase.from('jobs').insert({
      employer_id: userId,
      title: job.title,
      category: job.category,
      type: job.type,
      location: job.location,
      company_name: job.company_name,
      experience_level: job.experience_level,
      description: job.description,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      currency: job.currency,
      whatsapp_number: job.whatsapp_number,
      status: 'approved',
    });

    if (jobError) {
      console.error('  ❌ Failed to insert job "' + job.title + '":', jobError.message);
    } else {
      console.log('  ✅ Posted:', job.title, '(' + job.location + ')');
      jobsCreated++;
    }
  }

  console.log('\n🎉 Jobs seeding complete! Created:', jobsCreated);
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
