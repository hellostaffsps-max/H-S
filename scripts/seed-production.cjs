const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lwfmnngfmnnoydpcnuox.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Zm1ubmdmbW5ub3lkcGNudW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk3NTM1NSwiZXhwIjoyMDkzNTUxMzU1fQ.nT51tZgu3g7k5S_5PMbl8OGcMjyPwx-HdjyT4oWwNoQ',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEMO_EMPLOYERS = [
  {
    email: 'demo.burj@hellostaff.ps',
    password: 'DemoPass123!',
    full_name: 'مقهى البرج',
    company_name: 'مقهى البرج',
    description: 'مقهى متخصص في القهوة المختصة واللاتيه آرت في رام الله',
    jobs: [
      { title: 'باريستا خبرة', category: 'باريستا', type: 'دوام كامل', location: 'رام الله - شارع ركب', experience_level: 'سنتان', description: 'نبحث عن باريستا ذو خبرة لا تقل عن سنتين في تحضير القهوة المختصة واللاتيه آرت. العمل في أجواء شبابية ومهنية. الراتب يبدأ من 3500 شيكل + بونص شهري.', salary_min: 3500, salary_max: 4500, currency: 'ILS', whatsapp_number: '+970599123456' },
      { title: 'نادل/ة', category: 'نادل/ة', type: 'دوام جزئي', location: 'رام الله - شارع ركب', experience_level: 'بدون خبرة', description: 'فرصة عمل للنادلين الجدد في أجواء ودية. تدريب مجاني على رأس العمل. دوام مسائي من 4 مساءً حتى 12 ليلاً. الراتب 2500 شيكل.', salary_min: 2500, salary_max: 2500, currency: 'ILS', whatsapp_number: '+970599123456' },
    ],
  },
  {
    email: 'demo.zaytouna@hellostaff.ps',
    password: 'DemoPass123!',
    full_name: 'مطعم زيتونة',
    company_name: 'مطعم زيتونة',
    description: 'مطعم فلسطيني أصيل يقدم المأكولات الشعبية في نابلس',
    jobs: [
      { title: 'طاهي/ة مساعد', category: 'طاهي/ة', type: 'دوام كامل', location: 'نابلس - البلدة القديمة', experience_level: '1-3 سنوات', description: 'مطلوب طاهي مساعد ذو خبرة في المطبخ الفلسطيني. العمل 6 أيام في الأسبوع. يفضّل من سكان نابلس والمناطق المحيطة. الراتب 4000 شيكل + وجبات.', salary_min: 4000, salary_max: 5000, currency: 'ILS', whatsapp_number: '+970599234567' },
      { title: 'كاشير', category: 'كاشير', type: 'دوام كامل', location: 'نابلس - البلدة القديمة', experience_level: 'سنة واحدة', description: 'مطلوب كاشير ذو خبرة في التعامل مع برامج نقاط البيع. مهارات تواصل جيدة وابتسامة دائمة. الراتب 3000 شيكل.', salary_min: 3000, salary_max: 3200, currency: 'ILS', whatsapp_number: '+970599234567' },
    ],
  },
  {
    email: 'demo.karmel@hellostaff.ps',
    password: 'DemoPass123!',
    full_name: 'فندق الكرمل',
    company_name: 'فندق الكرمل',
    description: 'فندق ثلاث نجوم في قلب بيت لحم يقدم خدمات الضيافة الفاخرة',
    jobs: [
      { title: 'مضيف/ة استقبال', category: 'مضيف/ة', type: 'دوام كامل', location: 'بيت لحم - شارع النجمة', experience_level: '3+ سنوات', description: 'مطلوب موظف/ة استقبال للعمل في فندق ثلاث نجوم. يجب إتقان اللغتين العربية والإنجليزية. خبرة في برامج الحجز الفندقي. الراتب 4500 شيكل + تيبس.', salary_min: 4500, salary_max: 5500, currency: 'ILS', whatsapp_number: '+970599345678' },
      { title: 'طاهي/ة رئيسي', category: 'طاهي/ة', type: 'دوام كامل', location: 'بيت لحم - شارع النجمة', experience_level: '5+ سنوات', description: 'مطلوب شيف رئيسي ذو خبرة واسعة في المطبخ الدولي والمحلي. قدرة على إدارة فريق المطبخ والتحكم في التكاليف. الراتب يبدأ من 6000 شيكل.', salary_min: 6000, salary_max: 8000, currency: 'ILS', whatsapp_number: '+970599345678' },
    ],
  },
  {
    email: 'demo.shawaya@hellostaff.ps',
    password: 'DemoPass123!',
    full_name: 'مطعم الشواية',
    company_name: 'مطعم الشواية',
    description: 'مطعم مشاوي سريع يقدم أفضل المشاوي الفلسطينية في رام الله',
    jobs: [
      { title: 'مساعد مطبخ', category: 'طاهي/ة', type: 'دوام كامل', location: 'رام الله - المنطقة الصناعية', experience_level: 'بدون خبرة', description: 'فرصة للشباب الجادين للدخول في مجال المطاعم. تدريب مجاني على رأس العمل في قسم التحضير والتقطيع. الراتب 2800 شيكل + وجبات يومية.', salary_min: 2800, salary_max: 3000, currency: 'ILS', whatsapp_number: '+970599456789' },
      { title: 'مدير مطعم', category: 'مدير', type: 'دوام كامل', location: 'رام الله - المنطقة الصناعية', experience_level: '3+ سنوات', description: 'مطلوب مدير مطعم ذو خبرة في إدارة فرق العمل والمخزون وجودة الخدمة. مهارات قيادية وقدرة على اتخاذ القرار. الراتب 5000 شيكل + بونص أداء.', salary_min: 5000, salary_max: 6500, currency: 'ILS', whatsapp_number: '+970599456789' },
    ],
  },
  {
    email: 'demo.diwan@hellostaff.ps',
    password: 'DemoPass123!',
    full_name: 'مقهى ديوان',
    company_name: 'مقهى ديوان',
    description: 'مقهى ثقافي في الخليل يجمع بين القهوة المختصة والفعاليات الثقافية',
    jobs: [
      { title: 'باريستا', category: 'باريستا', type: 'دوام جزئي', location: 'الخليل - مركز المدينة', experience_level: 'سنة واحدة', description: 'مطلوب باريستا للعمل في مقهى ثقافي. خبرة في V60 وإسبريسو واللاتيه آرت. العمل أيام الجمعة والسبت بشكل رئيسي. الراتب 2000 شيكل.', salary_min: 2000, salary_max: 2500, currency: 'ILS', whatsapp_number: '+970599567890' },
      { title: 'توصيل طلبات', category: 'توصيل', type: 'دوام جزئي', location: 'الخليل - مركز المدينة', experience_level: 'بدون خبرة', description: 'مطلوب موظف توصيل طلبات بدراجة نارية أو سيارة شخصية. يجب امتلاك رخصة قيادة سارية. العمل مساءً فقط. الراتب بالعمولة + بدل بنزين.', salary_min: 1500, salary_max: 3000, currency: 'ILS', whatsapp_number: '+970599567890' },
    ],
  },
];

async function seed() {
  console.log('🌱 Seeding Hello Staff with real hospitality demo jobs...\n');
  let jobsCreated = 0;
  let employersCreated = 0;

  for (const emp of DEMO_EMPLOYERS) {
    const { data: existingEmployer } = await supabase
      .from('employers')
      .select('profile_id')
      .eq('company_name', emp.company_name)
      .single();

    let userId;

    if (existingEmployer) {
      userId = existingEmployer.profile_id;
      console.log('  ⏭️  Employer "' + emp.company_name + '" already exists');
    } else {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emp.email)
        .single();

      if (existingProfile) {
        userId = existingProfile.id;
        console.log('  ⏭️  User exists, adding employer record for ' + emp.company_name);
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: emp.email,
          password: emp.password,
          email_confirm: true,
          user_metadata: { full_name: emp.full_name, role: 'employer' },
        });

        if (authError || !authData.user) {
          console.error('  ❌ Failed to create user for ' + emp.company_name + ':', authError?.message);
          continue;
        }

        userId = authData.user.id;
        console.log('  ✅ Created user: ' + emp.company_name + ' (' + userId + ')');

        const { error: profileError } = await supabase.from('profiles').insert({
          id: userId,
          role: 'employer',
          full_name: emp.full_name,
          email: emp.email,
        });

        if (profileError && !profileError.message.includes('duplicate')) {
          console.error('  ❌ Failed to insert profile for ' + emp.company_name + ':', profileError.message);
          continue;
        }
      }

      const { error: employerError } = await supabase.from('employers').insert({
        profile_id: userId,
        company_name: emp.company_name,
        description: emp.description,
      });

      if (employerError) {
        console.error('  ❌ Failed to insert employer for ' + emp.company_name + ':', employerError.message);
        continue;
      }
      console.log('  ✅ Added employer record for ' + emp.company_name);
      employersCreated++;
    }

    for (const job of emp.jobs) {
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('employer_id', userId)
        .eq('title', job.title)
        .single();

      if (existingJob) {
        console.log('    ⏭️  Job "' + job.title + '" already exists');
        continue;
      }

      const { error: jobError } = await supabase.from('jobs').insert({
        employer_id: userId,
        title: job.title,
        category: job.category,
        type: job.type,
        location: job.location,
        company_name: emp.company_name,
        experience_level: job.experience_level,
        description: job.description,
        salary_min: job.salary_min,
        salary_max: job.salary_max,
        currency: job.currency,
        whatsapp_number: job.whatsapp_number,
        status: 'approved',
      });

      if (jobError) {
        console.error('    ❌ Failed to insert job "' + job.title + '":', jobError.message);
      } else {
        console.log('    ✅ Posted: ' + job.title + ' (' + job.location + ')');
        jobsCreated++;
      }
    }

    console.log('');
  }

  console.log('🎉 Seeding complete!');
  console.log('   Employers created:', employersCreated);
  console.log('   Jobs created:', jobsCreated);
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
