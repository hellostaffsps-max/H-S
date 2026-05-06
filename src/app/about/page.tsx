"use client";

import { motion } from "motion/react";
import {
  Target,
  Eye,
  HeartHandshake,
  TrendingUp,
  Users,
  Briefcase,
  Star,
  Award,
} from "lucide-react";

const stats = [
  { icon: Briefcase, value: "500+", label: "وظيفة منشورة" },
  { icon: Users, value: "10,000+", label: "مستخدم نشط" },
  { icon: Star, value: "1,200+", label: "توظيف ناجح" },
  { icon: Award, value: "98%", label: "نسبة رضا العملاء" },
];

const values = [
  {
    icon: HeartHandshake,
    title: "الثقة والشفافية",
    desc: "نؤمن بأن الثقة أساس أي علاقة ناجحة. نوفر منصة شفافة تربط أصحاب العمل بالكفاءات بمصداقية تامة.",
  },
  {
    icon: Target,
    title: "التميز والجودة",
    desc: "نحن ملتزمون بتقديم أعلى معايير الجودة في كل جانب من جوانب خدماتنا، من فرز المرشحين إلى دعم العملاء.",
  },
  {
    icon: TrendingUp,
    title: "الابتكار والتطور",
    desc: "نسعى دائماً لتطوير حلول ذكية تواكب متطلبات سوق العمل المتغيرة في قطاع الضيافة.",
  },
  {
    icon: Eye,
    title: "رؤية مستقبلية",
    desc: "نهدف لأن نكون المنصة الرائدة في توظيف قطاع الضيافة في فلسطين والمنطقة العربية.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col" dir="rtl">
      {/* Hero */}
      <section className="bg-brand-600 text-white py-12 sm:py-16 lg:py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full border-[40px] border-white"></div>
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full border-[30px] border-white"></div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-black mb-6 leading-tight"
          >
            نبني مستقبل الضيافة<br />وظيفة بظيفة
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-brand-50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed"
          >
            Hello Staff هي المنصة المتخصصة الأولى في فلسطين لربط أصحاب المطاعم والمقاهي بأفضل الكفاءات في قطاع الضيافة.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto w-full px-4 -mt-6 sm:-mt-8 lg:-mt-10 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-slate-100 text-center"
            >
              <stat.icon className="h-7 w-7 sm:h-8 sm:w-8 text-brand-600 mx-auto mb-3" />
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="max-w-4xl mx-auto w-full px-4 py-12 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-4 sm:mb-6">قصتنا</h2>
        <p className="text-slate-600 leading-relaxed sm:leading-loose text-base sm:text-lg mb-4 sm:mb-6">
          انطلقت Hello Staff في عام 2025 من رؤية بسيطة: إيجاد حل لتحدي التوظيف الذي يواجه قطاع الضيافة في فلسطين. لاحظنا أن أصحاب المطاعم والمقاهي يقضون أسابيع في البحث عن موظفين مؤهلين، بينما يعجز الكثير من الباحثين عن العمل عن الوصول لفرص حقيقية.
        </p>
        <p className="text-slate-600 leading-relaxed sm:leading-loose text-base sm:text-lg">
          من هنا جاءت فكرة إنشاء منصة متخصصة تجمع بين التقنية الحديثة والفهم العميق لاحتياجات قطاع الضيافة. اليوم، نفتخر بأننا أصبحنا الشريك الموثوق لعشرات المنشآت وآلاف الباحثين عن عمل.
        </p>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-12 sm:py-20">
        <div className="max-w-6xl mx-auto w-full px-4">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">قيمنا</h2>
            <p className="text-slate-500">المبادئ التي توجهنا في كل خطوة</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {values.map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mb-5">
                  <val.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-3">{val.title}</h3>
                <p className="text-slate-500 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-6xl mx-auto w-full px-4 py-12 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          <div className="bg-brand-600 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 lg:p-10 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <Target className="h-12 w-12 mx-auto mb-6" />
            <h3 className="text-xl sm:text-2xl font-black mb-4">مهمتنا</h3>
            <p className="text-brand-50 leading-relaxed">
              تمكين قطاع الضيافة الفلسطيني من الوصول إلى أفضل الكفاءات بأسرع وقت وأقل جهد، من خلال منصة ذكية متخصصة تلبي احتياجات السوق المحلي.
            </p>
          </div>
          <div className="bg-slate-900 rounded-[2rem] p-10 text-white text-center relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-500/20 rounded-full"></div>
            <Eye className="h-12 w-12 mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-4">رؤيتنا</h3>
            <p className="text-slate-300 leading-relaxed">
              أن نكون المنصة الأولى والأكثر موثوقية في توظيف قطاع الضيافة في فلسطين والمنطقة العربية، مساهمين في بناء اقتصاد قوي ومزدهر.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
