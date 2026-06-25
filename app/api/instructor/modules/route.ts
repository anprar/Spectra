import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 1. GET: List all training modules with their lessons
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const modules = await db.trainingModule.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        lessons: {
          orderBy: { sortOrder: 'asc' }
        },
        createdBy: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, modules });
  } catch (error) {
    console.error('Fetch modules error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. POST: Create a new training module
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { title, summary, status, lessons } = await request.json();

    if (!title || !summary) {
      return NextResponse.json({ error: 'Judul dan Ringkasan wajib diisi.' }, { status: 400 });
    }

    // Generate unique slug
    let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let slug = baseSlug;
    let count = 1;
    while (await db.trainingModule.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    const newModule = await db.$transaction(async (tx) => {
      const mod = await tx.trainingModule.create({
        data: {
          title,
          slug,
          summary,
          status: status || 'draft',
          createdById: session.userId,
          publishedAt: status === 'published' ? new Date() : null,
        },
      });

      if (lessons && Array.isArray(lessons)) {
        for (let i = 0; i < lessons.length; i++) {
          const l = lessons[i];
          await tx.trainingLesson.create({
            data: {
              moduleId: mod.id,
              title: l.title,
              contentType: l.contentType || 'text',
              contentBody: l.contentBody || '',
              externalUrl: l.externalUrl || '',
              isRequired: l.isRequired !== undefined ? l.isRequired : true,
              sortOrder: i + 1,
            },
          });
        }
      }

      return mod;
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'create_training_module',
        entityType: 'TrainingModule',
        entityId: newModule.id,
        metadataJson: JSON.stringify({ title }),
      },
    });

    return NextResponse.json({ success: true, module: newModule });
  } catch (error) {
    console.error('Create module error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
