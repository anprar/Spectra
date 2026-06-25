import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: List all active candidates
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const candidates = await db.user.findMany({
      where: { role: 'candidate', isActive: true },
      select: {
        id: true,
        fullName: true,
        email: true
      },
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    console.error('Fetch candidates error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
