import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// Sanitizer function against CSV Injection / Formula Injection
// Prevents execution of spreadsheet formulas starting with =, +, -, @
function sanitizeCsvValue(value: any): string {
  if (value === null || value === undefined) return '';
  let strVal = value.toString().trim();
  
  // Replace double quotes with escaped double quotes
  strVal = strVal.replace(/"/g, '""');
  
  // Check if the value starts with formula characters
  const formulaChars = ['=', '+', '-', '@'];
  if (formulaChars.some((char) => strVal.startsWith(char))) {
    // Prefix with a single quote to force Excel to treat it as text
    return `'"${strVal}"'`;
  }
  
  // Wrap in double quotes if it contains commas, newlines or double quotes
  if (strVal.includes(',') || strVal.includes('\n') || strVal.includes('"')) {
    return `"${strVal}"`;
  }
  
  return strVal;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session || (session.role !== 'instructor' && session.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized. Akses ditolak.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    // 2. Fetch exam attempts from SQLite
    const attempts = await db.examAttempt.findMany({
      where: examId ? { examId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        candidate: true,
        exam: true,
      },
    });

    // 3. Generate CSV Content
    const csvHeaders = [
      'ID Attempt',
      'Nama Kandidat',
      'Email Kandidat',
      'Judul Ujian',
      'Skor Perolehan',
      'Skor Maksimal',
      'Persentase',
      'Status Kelulusan',
      'Metode Submit',
      'Tanggal Mulai',
      'Tanggal Selesai',
    ];

    const csvRows = [csvHeaders.join(',')];

    for (const att of attempts) {
      const row = [
        sanitizeCsvValue(att.id),
        sanitizeCsvValue(att.candidate.fullName),
        sanitizeCsvValue(att.candidate.email),
        sanitizeCsvValue(att.exam.title),
        sanitizeCsvValue(att.score),
        sanitizeCsvValue(att.maxScore),
        sanitizeCsvValue(`${att.percentage}%`),
        sanitizeCsvValue(att.passed ? 'LULUS' : 'GAGAL'),
        sanitizeCsvValue(att.autoSubmitted ? 'AUTO-SUBMIT' : 'MANUAL'),
        sanitizeCsvValue(new Date(att.startedAt).toISOString()),
        sanitizeCsvValue(att.submittedAt ? new Date(att.submittedAt).toISOString() : '-'),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // 4. Record Export Log
    const exportRecord = await db.resultExport.create({
      data: {
        userId: session.userId,
        filtersJson: JSON.stringify({ examId: examId || 'all' }),
        filePath: 'STREAMED_DIRECTLY',
      },
    });

    // 5. Write Audit Log
    await db.auditLog.create({
      data: {
        userId: session.userId,
        action: 'export_results',
        entityType: 'ResultExport',
        entityId: exportRecord.id,
        metadataJson: JSON.stringify({ count: attempts.length, examId: examId || 'all' }),
      },
    });

    // 6. Return downloadable CSV response
    const filename = `laporan_spectra_${new Date().toISOString().slice(0,10)}.csv`;
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=${filename}`,
      },
    });

  } catch (error) {
    console.error('Export CSV error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server saat mengekspor laporan.' }, { status: 500 });
  }
}
