import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { evaluateDiscount } from '@/lib/commerce/pricing';

export const dynamic = 'force-dynamic';

/** Preview a discount code at checkout. The checkout API re-validates it. */
export async function POST(request: NextRequest) {
  try {
    const { code, subtotalCents } = await request.json();
    if (typeof code !== 'string' || !Number.isFinite(subtotalCents)) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const result = await evaluateDiscount(getSupabaseAdmin(), code.slice(0, 40), Math.max(0, Math.round(subtotalCents)));
    return NextResponse.json(result, { status: 'error' in result ? 400 : 200 });
  } catch (e) {
    console.error('[discount] error', e);
    return NextResponse.json({ error: 'Could not check this code right now.' }, { status: 500 });
  }
}
