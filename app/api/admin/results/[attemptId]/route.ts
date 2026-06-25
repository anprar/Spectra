import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const session = await getSession();

    if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
      return NextResponse.json({ error: 'Unauthorized. Akses ditolak.' }, { status: 401 });
    }

    const attempt = await db.examAttempt.findUnique({
      where: { id: attemptId },
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
        },
        questions: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Sesi ujian tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, attempt });
  } catch (error: any) {
    console.error('Fetch attempt detail error:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
