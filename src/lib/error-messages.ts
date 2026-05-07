/**
 * Maps common Supabase/Postgres error messages to Arabic user-friendly messages.
 */
const ERROR_MAP: Array<[RegExp | string, string]> = [
  [/duplicate key value violates unique constraint/i, 'هذا السجل موجود بالفعل'],
  [/new row violates check constraint/i, 'القيمة المدخلة غير صالحة'],
  [/violates foreign key constraint/i, 'السجل المرتبط غير موجود'],
  [/permission denied/i, 'ليس لديك صلاحية لتنفيذ هذا الإجراء'],
  [/JWT expired/i, 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً'],
  [/invalid input syntax/i, 'صيغة البيانات المدخلة غير صحيحة'],
  [/null value in column.*violates not-null constraint/i, 'يرجى ملء جميع الحقول المطلوبة'],
  [/value too long for type/i, 'النص المدخل طويل جداً'],
  [/row-level security/i, 'ليس لديك صلاحية للوصول إلى هذه البيانات'],
  [/relation.*does not exist/i, 'خطأ في النظام، يرجى التواصل مع الدعم'],
  [/could not find/i, 'لم يتم العثور على البيانات المطلوبة'],
  [/network/i, 'خطأ في الاتصال، يرجى التحقق من الإنترنت والمحاولة مجدداً'],
  [/timeout/i, 'انتهت مهلة الطلب، يرجى المحاولة لاحقاً'],
];

/**
 * Convert a Supabase/Postgres error message to an Arabic user-friendly message.
 * If no match is found, returns a generic Arabic error message.
 */
export function toArabicError(errorMessage: string): string {
  if (!errorMessage) return 'حدث خطأ غير متوقع';

  for (const [pattern, arabicMessage] of ERROR_MAP) {
    if (typeof pattern === 'string') {
      if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
        return arabicMessage;
      }
    } else {
      if (pattern.test(errorMessage)) {
        return arabicMessage;
      }
    }
  }

  return 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً';
}
