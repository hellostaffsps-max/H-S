import { z } from 'zod';

// ─── Job Validation ─────────────────────────────────────────────────────────
export const jobSchema = z.object({
  title: z.string().min(3, 'عنوان الوظيفة يجب أن يكون 3 أحرف على الأقل').max(200, 'عنوان الوظيفة طويل جداً'),
  category: z.string().min(1, 'يجب اختيار التخصص'),
  type: z.string().min(1, 'يجب اختيار نوع الدوام'),
  location: z.string().min(2, 'يجب تحديد الموقع').max(100, 'الموقع طويل جداً'),
  company_name: z.string().min(2, 'اسم الشركة يجب أن يكون حرفين على الأقل').max(150),
  experience_level: z.string().optional().nullable(),
  description: z.string().min(10, 'وصف الوظيفة يجب أن يكون 10 أحرف على الأقل').max(5000, 'الوصف طويل جداً'),
  currency: z.string().default('ILS'),
  salary_min: z.coerce.number().min(0).nullable().optional(),
  salary_max: z.coerce.number().min(0).nullable().optional(),
  whatsapp_number: z.string().max(30, 'رقم الواتساب طويل').nullable().optional(),
}).refine((data) => {
  if (data.salary_min != null && data.salary_max != null) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: 'الراتب الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى',
  path: ['salary_max'],
});

export type JobInput = z.infer<typeof jobSchema>;

// ─── Profile Validation ─────────────────────────────────────────────────────
export const profileSchema = z.object({
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100, 'الاسم طويل جداً'),
  phone: z.string().max(20, 'رقم الهاتف طويل').nullable().optional(),
  location: z.string().max(100, 'الموقع طويل').nullable().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// ─── Seeker Profile Validation ──────────────────────────────────────────────
export const seekerProfileSchema = z.object({
  job_title: z.string().max(100).nullable().optional(),
  bio: z.string().max(2000, 'النبذة طويلة جداً').nullable().optional(),
  experience_years: z.coerce.number().min(0, 'سنوات الخبرة لا يمكن أن تكون سالبة').max(50).nullable().optional(),
  is_available: z.boolean().default(true),
  skills: z.array(z.string().max(50)).max(30, 'لا يمكن إضافة أكثر من 30 مهارة').default([]),
  cv_url: z.string().url('رابط السيرة الذاتية غير صالح').max(500).nullable().optional(),
});

export type SeekerProfileInput = z.infer<typeof seekerProfileSchema>;

// ─── Employer Profile Validation ────────────────────────────────────────────
export const employerProfileSchema = z.object({
  company_name: z.string().min(2, 'اسم الشركة يجب أن يكون حرفين على الأقل').max(150),
  description: z.string().max(3000, 'الوصف طويل جداً').nullable().optional(),
  logo_url: z.string().url('رابط الشعار غير صالح').max(500).nullable().optional(),
  business_type: z.string().max(50).nullable().optional(),
  city: z.string().max(50).nullable().optional(),
  area: z.string().max(50).nullable().optional(),
  whatsapp_number: z.string().max(30).nullable().optional(),
  business_email: z.string().email('البريد الإلكتروني غير صالح').max(100).nullable().optional(),
  number_of_branches: z.coerce.number().min(0).max(1000).nullable().optional(),
  number_of_employees: z.coerce.number().min(0).max(100000).nullable().optional(),
  opening_hours: z.string().max(200).nullable().optional(),
  cover_image_url: z.string().url('رابط الصورة غير صالح').max(500).nullable().optional(),
  application_preference: z.string().max(20).nullable().optional(),
  show_whatsapp_to_candidates: z.boolean().default(false),
});

export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;

// ─── Helper: convert Zod error to Arabic message ────────────────────────────
export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  return first?.message || 'بيانات غير صالحة، يرجى التحقق من المدخلات';
}
