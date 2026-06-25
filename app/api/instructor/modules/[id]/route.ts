import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// 1. PUT: Update a module and sync its lessons
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;
    const { title, summary, status, lessons } = await request.json();

    if (!title || !summary) {
      return NextResponse.json({ error: 'Judul dan Ringkasan wajib diisi.' }, { status: 400 });
    }

    // Check if module exists
    const existingModule = await db.trainingModule.findUnique({
      where: { id },
      include: { lessons: true }
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Modul tidak ditemukan.' }, { status: 404 });
    }

    // Generate slug if title changed
    let slug = existingModule.slug;
    if (title !== existingModule.title) {
      let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      slug = baseSlug;
      let count = 1;
      while (await db.trainingModule.findFirst({ where: { slug, id: { not: id } } })) {
        slug = `${baseSlug}-${count}`;
        count++;
      }
    }

    // Perform database transaction to update module and sync lessons
    const updatedModule = await db.$transaction(async (tx) => {
      // 1. Update module basic info
      const mod = await tx.trainingModule.update({
        where: { id },
        data: {
          title,
          slug,
          summary,
          status: status || 'draft',
          publishedAt: status === 'published' && existingModule.status !== 'published' ? new Date() : (status === 'draft' ? null : existingModule.publishedAt),
        }
      });

      if (lessons && Array.isArray(lessons)) {
        // 2. Get existing lesson IDs in DB
        const existingLessonIds = existingModule.lessons.map(l => l.id);
        const incomingLessonIds = lessons.filter(l => l.id).map(l => l.id);

        // 3. Identify deleted lessons
        const deletedLessonIds = existingLessonIds.filter(id => !incomingLessonIds.includes(id));

        // 4. Delete removed lessons
        if (deletedLessonIds.length > 0) {
          await tx.trainingLesson.deleteMany({
            where: { id: { in: deletedLessonIds } }
          });
        }

        // 5. Upsert incoming lessons
        for (let i = 0; i < lessons.length; i++) {
          const l = lessons[i];
          const lessonData = {
            title: l.title,
            contentType: l.contentType || 'text',
            contentBody: l.contentBody || '',
            externalUrl: l.externalUrl || '',
            isRequired: l.isRequired !== undefined ? l.isRequired : true,
            sortOrder: i + 1, // enforce sequential ordering based on array index!
          };

          if (l.id && existingLessonIds.includes(l.id)) {
            // Update existing lesson
            await tx.trainingLesson.update({
              where: { id: l.id },
              data: lessonData
            });
          } else {
            // Create new lesson
            await tx.trainingLesson.create({
              data: {
                ...lessonData,
                moduleId: id
              }
            });
          }
        }
      }

      return mod;
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'update_training_module',
        entityType: 'TrainingModule',
        entityId: id,
        metadataJson: JSON.stringify({ title }),
      },
    });

    return NextResponse.json({ success: true, module: updatedModule });
  } catch (error) {
    console.error('Update module error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}

// 2. DELETE: Delete a module
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = params;

    const existingModule = await db.trainingModule.findUnique({
      where: { id }
    });

    if (!existingModule) {
      return NextResponse.json({ error: 'Modul tidak ditemukan.' }, { status: 404 });
    }

    // Check if the module is linked to any exams
    const linkedExams = await db.exam.findMany({
      where: { trainingModuleId: id }
    });

    if (linkedExams.length > 0) {
      return NextResponse.json({ 
        error: `Modul tidak dapat dihapus karena digunakan sebagai prasyarat pada ${linkedExams.length} ujian.` 
      }, { status: 400 });
    }

    await db.trainingModule.delete({
      where: { id }
    });

    // Write audit log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'delete_training_module',
        entityType: 'TrainingModule',
        entityId: id,
        metadataJson: JSON.stringify({ title: existingModule.title }),
      },
    });

    return NextResponse.json({ success: true, message: 'Modul berhasil dihapus.' });
  } catch (error) {
    console.error('Delete module error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 });
  }
}
