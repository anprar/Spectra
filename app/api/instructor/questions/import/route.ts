import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decryptSession } from '@/lib/auth';
import * as xlsx from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    // 1. Get user session from cookies
    const token = request.cookies.get('spectra_session')?.value;
    const session = token ? await decryptSession(token) : null;
    
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Akses ditolak.' }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bankId = formData.get('bankId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File Excel tidak ditemukan.' }, { status: 400 });
    }

    if (!bankId) {
      return NextResponse.json({ error: 'ID Bank Soal wajib ditentukan.' }, { status: 400 });
    }

    // 3. Verify Question Bank ownership or admin status
    const questionBank = await db.questionBank.findUnique({
      where: { id: bankId },
    });

    if (!questionBank) {
      return NextResponse.json({ error: 'Bank Soal tidak ditemukan.' }, { status: 404 });
    }

    if (questionBank.ownerId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Anda tidak memiliki hak akses ke Bank Soal ini.' }, { status: 403 });
    }

    // 4. Read File Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Parse Excel Spreadsheet
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows = xlsx.utils.sheet_to_json(sheet) as any[];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'File Excel kosong atau tidak memiliki baris data.' }, { status: 400 });
    }

    // 6. Validate & Import Questions (Transaction)
    const importedQuestions: any[] = [];
    const errors: string[] = [];

    await db.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Row number in Excel sheet (1-indexed + header)

        // Extract and trim fields
        const questionText = row['Pertanyaan']?.toString().trim();
        const optionA = row['Pilihan A']?.toString().trim();
        const optionB = row['Pilihan B']?.toString().trim();
        const optionC = row['Pilihan C']?.toString().trim();
        const optionD = row['Pilihan D']?.toString().trim();
        const optionE = row['Pilihan E']?.toString().trim() || null;
        const correctOption = row['Kunci Jawaban']?.toString().trim().toUpperCase();
        const explanation = row['Pembahasan']?.toString().trim() || null;
        const category = row['Kategori']?.toString().trim() || 'Umum';
        let difficulty = row['Tingkat Kesulitan']?.toString().trim() || 'Medium';

        // Validate required fields
        if (!questionText) {
          errors.push(`Baris ${rowNum}: Pertanyaan kosong.`);
          continue;
        }
        if (!optionA || !optionB || !optionC || !optionD) {
          errors.push(`Baris ${rowNum}: Pilihan jawaban A, B, C, dan D wajib diisi.`);
          continue;
        }
        if (!correctOption || !['A', 'B', 'C', 'D', 'E'].includes(correctOption)) {
          errors.push(`Baris ${rowNum}: Kunci jawaban tidak valid (harus A, B, C, D, atau E).`);
          continue;
        }
        if (correctOption === 'E' && !optionE) {
          errors.push(`Baris ${rowNum}: Kunci jawaban bernilai E, tetapi Pilihan E kosong.`);
          continue;
        }

        // Normalize difficulty
        if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
          difficulty = 'Medium';
        }

        // Insert Question
        const createdQuestion = await tx.question.create({
          data: {
            bankId: bankId,
            category: category,
            difficulty: difficulty,
            questionText: questionText,
            explanationText: explanation,
            status: 'active',
          },
        });

        // Insert Options
        const optionsToCreate = [
          { key: 'A', text: optionA, isCorrect: correctOption === 'A', order: 1 },
          { key: 'B', text: optionB, isCorrect: correctOption === 'B', order: 2 },
          { key: 'C', text: optionC, isCorrect: correctOption === 'C', order: 3 },
          { key: 'D', text: optionD, isCorrect: correctOption === 'D', order: 4 },
        ];

        if (optionE) {
          optionsToCreate.push({ key: 'E', text: optionE, isCorrect: correctOption === 'E', order: 5 });
        }

        for (const opt of optionsToCreate) {
          await tx.questionOption.create({
            data: {
              questionId: createdQuestion.id,
              optionKey: opt.key,
              optionText: opt.text,
              isCorrect: opt.isCorrect,
              sortOrder: opt.order,
            },
          });
        }

        importedQuestions.push(createdQuestion);
      }

      if (errors.length > 0) {
        // If there are validation errors, rollback the transaction by throwing an error
        throw new Error(JSON.stringify(errors));
      }
    });

    // 7. Write Audit Log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'import_questions',
        entityType: 'QuestionBank',
        entityId: bankId,
        metadataJson: JSON.stringify({ count: importedQuestions.length }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${importedQuestions.length} soal ke dalam Bank Soal.`,
      count: importedQuestions.length,
    });

  } catch (error: any) {
    // Check if it's our validation error thrown during transaction
    try {
      const parsedErrors = JSON.parse(error.message);
      if (Array.isArray(parsedErrors)) {
        return NextResponse.json({
          error: 'Gagal mengimpor file Excel karena kesalahan validasi data.',
          validationErrors: parsedErrors,
        }, { status: 400 });
      }
    } catch (_) {}

    console.error('Import error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat memproses impor soal.' }, { status: 500 });
  }
}
