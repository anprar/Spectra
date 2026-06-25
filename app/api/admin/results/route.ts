import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch all candidate exam attempts for administrative review
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const passedFilter = searchParams.get('passed'); // 'true', 'false', or empty

    const attempts = await db.examAttempt.findMany({
      where: {
        AND: [
          query ? {
            OR: [
              { candidate: { fullName: { contains: query } } },
              { candidate: { email: { contains: query } } },
              { exam: { title: { contains: query } } }
            ]
          } : {},
          passedFilter === 'true' ? { passed: true, status: 'submitted' } : {},
          passedFilter === 'false' ? { passed: false, status: 'submitted' } : {}
        ]
      },
      include: {
        candidate: {
          select: {
            fullName: true,
            email: true
          }
        },
        exam: {
          select: {
            title: true,
            passScore: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ attempts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
