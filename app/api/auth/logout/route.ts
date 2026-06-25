import { NextRequest, NextResponse } from 'next/server';
import { deleteSessionCookie, getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (session) {
      // Log the logout action
      await db.auditLog.create({
        data: {
          userId: session.userId,
          action: 'logout',
          ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
          userAgent: request.headers.get('user-agent') || 'Unknown',
        },
      });
    }

    // Clear the cookie
    await deleteSessionCookie();

    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('application/json')) {
      return NextResponse.json({ success: true, message: 'Berhasil keluar.' });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memproses logout.' }, { status: 500 });
  }
}
