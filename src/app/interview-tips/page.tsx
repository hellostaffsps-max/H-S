"use client";
import { CheckCircle2, MessageSquare, Utensils, Clock, Smile, Shield } from 'lucide-react';

export default function InterviewTips() {
  const tips = [
    {
      icon: Smile,
      title: "الابتسامة والمظهر اللائق",
      description: "الضيافة تبدأ بابتسامة. احرص على ارتداء ملابس مهنية ونظيفة تناسب طبيعة المكان، وحافظ على لغة جسد إيجابية ومرحبة طوال المقابلة."
    },
    {
      icon: MessageSquare,
      title: "مهارات التواصل",
      description: "صاحب العمل يبحث عن شخص قادر على التعامل مع الزبائن بلباقة. تحدث بوضوح، واستمع جيداً لأسئلة المقابل، ولا تتردد في طرح أسئلة ذكية حول طبيعة العمل."
    },
    {
      icon: Utensils,
      title: "المعرفة بقائمة الطعام (المنيو)",
      description: "إذا كنت تتقدم لمطعم أو مقهى معين، قم بزيارة صفحاتهم على مواقع التواصل واطلع على نوعية الأطباق أو المشروبات التي يقدمونها. هذا سيظهر مدى اهتمامك."
    },
    {
      icon: Clock,
      title: "الالتزام بالمواعيد",
      description: "الوصول مبكراً بـ 10 دقائق يعطي انطباعاً أولياً ممتازاً عن التزامك وجديتك في العمل، وهو أمر حاسم في قطاع المطاعم والمقاهي."
    },
    {
      icon: Shield,
      title: "التعامل مع الضغط",
      description: "كن مستعداً للإجابة عن أسئلة تخص كيفية تعاملك مع الزبائن الغاضبين أو أوقات الذروة والضغط الشديد (Rush hours). اذكر أمثلة أو مواقف سابقة إن وجدت."
    },
    {
      icon: CheckCircle2,
      title: "الصدق والشفافية",
      description: "كن صادقاً بشأن مستوى خبرتك والمهام التي تتقنها، والأوقات التي يمكنك العمل بها (الورديات). الصدق يبني الثقة من اللحظة الأولى."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="bg-brand-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-10 h-10 text-brand-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 tracking-tight">نصائح لاجتياز مقابلة العمل بنجاح</h1>
        <p className="text-lg text-slate-600">قطاع الضيافة يبحث دائماً عن الشغف وحسن التعامل. إليك أهم النصائح التي ستساعدك على ترك انطباع رائع في مقابلتك القادمة للمطعم أو المقهى.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tips.map((tip, idx) => {
          const Icon = tip.icon;
          return (
            <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:border-brand-300 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center mb-6">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{tip.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{tip.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-16 bg-slate-900 rounded-[2rem] p-8 md:p-12 text-center max-w-4xl mx-auto relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">هل أنت مستعد لتطبيق هذه النصائح؟</h2>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto">تصفح أحدث الوظائف المتاحة في المطاعم والمقاهي وقدم طلبك الآن.</p>
          <a href="/jobs" className="inline-flex bg-brand-500 hover:bg-brand-400 text-white font-semibold text-sm px-8 py-3.5 rounded-xl transition-colors shadow-lg shadow-brand-500/25">
            تصفح الوظائف
          </a>
        </div>
      </div>
    </div>
  );
}
