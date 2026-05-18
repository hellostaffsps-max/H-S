import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Check rate limit for an action without performing it.
 * Used by client-side forms to block requests early.
 */
export async function POST(request: NextRequest) {
  try {
    const { action, limit, windowMs } = await request.json();

    if (!action || typeof limit !== 'number' || typeof windowMs !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const result = await checkRateLimit(action, limit, windowMs);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'لقد تجاوزت الحد المسموح من المحاولات، يرجى المحاولة لاحقاً' },
        { status: 429 }
      );
    }

    return NextResponse.json({ success: true, remaining: result.remaining });
  } catch {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء التحقق' },
      { status: 500 }
    );
  }
}
