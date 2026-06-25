import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// 1. GET: Fetch all users with query and role filters
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const role = searchParams.get('role') || '';

    const users = await db.user.findMany({
      where: {
        AND: [
          query ? {
            OR: [
              { fullName: { contains: query } },
              { email: { contains: query } }
            ]
          } : {},
          role ? { role } : {}
        ]
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. POST: Create a new user
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Akses ditolak.' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, fullName, role, isActive } = body;

    // Validation
    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi.' }, { status: 400 });
    }

    if (!['admin', 'instructor', 'candidate'].includes(role)) {
      return NextResponse.json({ error: 'Peran pengguna tidak valid.' }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        fullName: fullName.trim(),
        role,
        isActive: isActive !== undefined ? !!isActive : true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // Create Audit Log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'create_user',
        entityType: 'User',
        entityId: newUser.id,
        metadataJson: JSON.stringify({ email: newUser.email, role: newUser.role })
      }
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
