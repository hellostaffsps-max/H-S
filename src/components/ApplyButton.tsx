"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { applyToJob } from '@/app/actions/applications';
import { Briefcase, Loader2, CheckCircle } from 'lucide-react';

interface ApplyButtonProps {
  jobId: string;
  isLoggedIn: boolean;
}

export default function ApplyButton({ jobId, isLoggedIn }: ApplyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleApply() {
    if (!isLoggedIn) {
      router.push('/auth/login?redirect=' + encodeURIComponent(`/jobs/${jobId}`));
      return;
    }

    setLoading(true);
    setError(null);

    const result = await applyToJob(jobId);

    if (result.success) {
      setApplied(true);
    } else {
      setError(result.error || 'حدث خطأ');
    }

    setLoading(false);
  }

  if (applied) {
    return (
      <button disabled className="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 px-6 py-3 rounded-xl text-sm font-bold">
        <CheckCircle className="h-4 w-4" />
        تم التقديم بنجاح
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleApply}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-70"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
        {isLoggedIn ? 'قدم الآن' : 'سجل دخولك للتقديم'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </>
  );
}
