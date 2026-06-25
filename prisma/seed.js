const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.attemptQuestion.deleteMany({});
  await prisma.examAttempt.deleteMany({});
  await prisma.examAssignment.deleteMany({});
  await prisma.examQuestionRule.deleteMany({});
  await prisma.exam.deleteMany({});
  await prisma.questionOption.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.questionBank.deleteMany({});
  await prisma.trainingProgress.deleteMany({});
  await prisma.trainingLesson.deleteMany({});
  await prisma.trainingModule.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Generate Password Hashes
  const adminPassword = await bcrypt.hash('Admin123', 10);
  const instructorPassword = await bcrypt.hash('Instructor123', 10);
  const candidatePassword = await bcrypt.hash('Candidate123', 10);

  // 3. Create Default Users
  console.log('Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@spectra.com',
      passwordHash: adminPassword,
      fullName: 'Agus Administrator',
      role: 'admin',
      isActive: true,
    },
  });

  const instructor = await prisma.user.create({
    data: {
      email: 'instructor@spectra.com',
      passwordHash: instructorPassword,
      fullName: 'Indra Instructor',
      role: 'instructor',
      isActive: true,
    },
  });

  const candidate = await prisma.user.create({
    data: {
      email: 'candidate@spectra.com',
      passwordHash: candidatePassword,
      fullName: 'Farhan Gunawan',
      role: 'candidate',
      isActive: true,
    },
  });

  console.log(`Users created: \n- Admin: ${admin.email}\n- Instructor: ${instructor.email}\n- Candidate: ${candidate.email}`);

  // 4. Create Training Module
  console.log('Creating training module...');
  const module = await prisma.trainingModule.create({
    data: {
      title: 'Budaya Perusahaan & Etika Profesional',
      slug: 'budaya-perusahaan-etika-profesional',
      summary: 'Pelajari visi, misi, nilai-nilai organisasi, serta standar perilaku profesional yang diharapkan dari seluruh karyawan baru.',
      status: 'published',
      createdById: instructor.id,
      publishedAt: new Date(),
    },
  });

  // 5. Create Lessons
  console.log('Creating lessons...');
  const lesson1 = await prisma.trainingLesson.create({
    data: {
      moduleId: module.id,
      title: 'Visi, Misi, & Nilai Utama Perusahaan',
      contentType: 'text',
      contentBody: `## Visi Perusahaan
Menjadi platform terpercaya dalam mendongkrak efisiensi talenta digital di seluruh Indonesia.

## Misi Perusahaan
1. Menyediakan solusi evaluasi rekrutmen objektif.
2. Membantu kandidat mempersiapkan kompetensi sebelum bertanding di lingkungan kerja nyata.

## Nilai Utama (Core Values): SPECTRA
*   **S** - Synergy (Sinergi dalam kolaborasi)
*   **P** - Professionalism (Profesionalitas tanpa kompromi)
*   **E** - Excellence (Keunggulan dalam eksekusi)
*   **C** - Customer-centric (Fokus pada solusi pengguna)
*   **T** - Trustworthiness (Integritas yang dapat dipercaya)
*   **R** - Resilience (Ketangguhan menghadapi tantangan)
*   **A** - Adaptability (Kemampuan adaptasi yang cepat)`,
      sortOrder: 1,
      isRequired: true,
    },
  });

  const lesson2 = await prisma.trainingLesson.create({
    data: {
      moduleId: module.id,
      title: 'Kode Etik & Standar Perilaku Profesional',
      contentType: 'text',
      contentBody: `## Standar Perilaku Kerja
Setiap karyawan SPECTRA wajib menjunjung tinggi integritas dalam setiap aktivitas. Beberapa poin penting yang diatur meliputi:

1. **Integritas Waktu:** Hadir tepat waktu dalam setiap agenda kerja.
2. **Kerahasiaan Data:** Melindungi seluruh data sensitif kandidat dan klien. Dilarang menyebarluaskan data evaluasi tanpa izin resmi.
3. **Komunikasi Profesional:** Menggunakan saluran resmi perusahaan untuk berkomunikasi secara asertif dan sopan.
4. **Anti-Korupsi & Kolusi:** Menolak segala bentuk gratifikasi yang dapat mempengaruhi objektivitas penilaian kerja.`,
      sortOrder: 2,
      isRequired: true,
    },
  });

  const lesson3 = await prisma.trainingLesson.create({
    data: {
      moduleId: module.id,
      title: 'Panduan Ujian Penilaian (Assessment Guide)',
      contentType: 'text',
      contentBody: `## Panduan Menempuh Ujian Uji Kompetensi
Sebelum memulai ujian evaluasi kandidat, pastikan Anda memahami aturan berikut demi kelancaran tes:

1. **Persiapan Perangkat:** Gunakan browser modern (Chromium, Firefox, atau Safari) pada komputer atau laptop.
2. **Koneksi Stabil:** Pastikan koneksi internet Anda stabil untuk menghindari kegagalan penyimpanan jawaban otomatis.
3. **Aturan Timer:** Timer bersifat *server-authoritative*. Begitu Anda menekan tombol "Mulai Ujian", penghitung waktu akan berjalan di server dan **tidak dapat dihentikan (no pause)**.
4. **Satu Jendela Browser:** Dilarang membuka ujian di beberapa jendela atau tab browser yang sama. Sistem memiliki sensor multi-tab yang akan mengunci pengerjaan Anda jika melanggar.
5. **Autosave & Auto-Submit:** Jawaban Anda disimpan otomatis setiap kali Anda memilih opsi. Jika waktu habis, sistem akan melakukan *auto-submit* secara instan.`,
      sortOrder: 3,
      isRequired: true,
    },
  });

  console.log('Lessons created successfully.');

  // 6. Create Question Bank
  console.log('Creating question bank...');
  const qBank = await prisma.questionBank.create({
    data: {
      name: 'Bank Soal Etika & Budaya SPECTRA',
      description: 'Daftar soal pilihan ganda mengenai kode etik, budaya kerja, dan pemecahan masalah profesional.',
      ownerId: instructor.id,
      visibility: 'public',
    },
  });

  // 7. Create Questions & Options
  console.log('Creating questions and options...');
  const questionsData = [
    {
      questionText: 'Manakah di bawah ini yang merupakan perwujudan dari nilai "Trustworthiness" dalam nilai utama SPECTRA?',
      explanationText: 'Trustworthiness mewakili kejujuran dan integritas penuh, termasuk mengakui kesalahan dan bertanggung jawab.',
      category: 'Budaya Kerja',
      difficulty: 'Easy',
      options: [
        { key: 'A', text: 'Menyelesaikan pekerjaan secepat mungkin tanpa memedulikan kualitas.', isCorrect: false },
        { key: 'B', text: 'Menutupi kesalahan tim agar tidak ditegur oleh manajemen.', isCorrect: false },
        { key: 'C', text: 'Bertindak jujur, menjaga rahasia data kandidat, dan berani bertanggung jawab atas keputusan kerja.', isCorrect: true },
        { key: 'D', text: 'Menyalin pekerjaan rekan kerja demi efisiensi waktu pribadi.', isCorrect: false },
        { key: 'E', text: 'Menolak berkolaborasi dengan divisi lain.', isCorrect: false },
      ],
    },
    {
      questionText: 'Apa yang akan terjadi jika kandidat terdeteksi membuka halaman ujian di dua tab browser secara bersamaan?',
      explanationText: 'Sistem SPECTRA dilengkapi sensor multi-tab yang akan menampilkan layar pemblokiran dan menonaktifkan input demi integritas ujian.',
      category: 'Protokol Ujian',
      difficulty: 'Easy',
      options: [
        { key: 'A', text: 'Ujian otomatis dibatalkan dan kandidat langsung dinyatakan tidak lulus.', isCorrect: false },
        { key: 'B', text: 'Tab kedua akan menampilkan layar pemblokiran sesi ganda untuk melindungi pengerjaan aktif.', isCorrect: true },
        { key: 'C', text: 'Waktu pengerjaan dikurangi setengah secara otomatis.', isCorrect: false },
        { key: 'D', text: 'Soal ujian akan diacak ulang dari nomor pertama.', isCorrect: false },
        { key: 'E', text: 'Sistem akan menutup browser secara paksa.', isCorrect: false },
      ],
    },
    {
      questionText: 'Bagaimanakah sistem timer berwaktu (timed exam) diatur di dalam mesin ujian SPECTRA?',
      explanationText: 'Timer ujian SPECTRA dihitung dan diawasi secara otoritatif di server (ends_at tetap), sehingga refresh halaman tidak akan mereset timer.',
      category: 'Protokol Ujian',
      difficulty: 'Medium',
      options: [
        { key: 'A', text: 'Timer berjalan di browser kandidat dan akan mereset jika halaman di-refresh.', isCorrect: false },
        { key: 'B', text: 'Kandidat dapat menekan tombol pause jika koneksi internet terputus.', isCorrect: false },
        { key: 'C', text: 'Timer diatur secara otoritatif di server; sisa waktu tetap berjalan meskipun browser ditutup atau di-refresh.', isCorrect: true },
        { key: 'D', text: 'Timer hanya berfungsi sebagai ornamen visual tanpa mengunci input jawaban.', isCorrect: false },
        { key: 'E', text: 'Waktu ujian akan bertambah secara otomatis setiap kali kandidat berpindah soal.', isCorrect: false },
      ],
    },
    {
      questionText: 'Tindakan manakah yang paling sesuai dengan kode etik perlindungan data di platform SPECTRA?',
      explanationText: 'Melindungi kerahasiaan data kandidat dan menolak membagikannya tanpa otorisasi resmi adalah kewajiban integritas dasar.',
      category: 'Kode Etik',
      difficulty: 'Medium',
      options: [
        { key: 'A', text: 'Membagikan data nilai kandidat ke media sosial untuk promosi korporat tanpa izin.', isCorrect: false },
        { key: 'B', text: 'Mengekspor laporan nilai kandidat secara bebas untuk diberikan kepada pihak luar.', isCorrect: false },
        { key: 'C', text: 'Menyimpan data hasil rekrutmen di server lokal terenkripsi dan membatasi hak akses hanya untuk tim rekrutmen berwenang.', isCorrect: true },
        { key: 'D', text: 'Membiarkan akun admin digunakan bersama oleh seluruh staf magang.', isCorrect: false },
        { key: 'E', text: 'Menghapus seluruh audit log aktivitas ekspor agar sistem berjalan lebih ringan.', isCorrect: false },
      ],
    },
    {
      questionText: 'Jika terjadi kendala jaringan saat pengerjaan ujian, bagaimanakah cara kerja fitur perlindungan jawaban kandidat?',
      explanationText: 'SPECTRA menggunakan fitur Interactive Micro-Save di mana setiap klik opsi jawaban langsung dikirimkan ke server secara berkala.',
      category: 'Sistem Teknis',
      difficulty: 'Hard',
      options: [
        { key: 'A', text: 'Jawaban hanya disimpan di browser kandidat dan baru dikirim saat menekan submit akhir.', isCorrect: false },
        { key: 'B', text: 'Sistem melakukan penyimpanan otomatis (micro-save) ke cloud setiap kali kandidat memilih atau mengubah opsi jawaban.', isCorrect: true },
        { key: 'C', text: 'Kandidat harus mengunduh file cadangan jawaban secara manual setiap 5 menit.', isCorrect: false },
        { key: 'D', text: 'Semua jawaban otomatis terhapus jika koneksi internet terputus lebih dari 10 detik.', isCorrect: false },
        { key: 'E', text: 'Jawaban dikirimkan melalui email cadangan secara berkala.', isCorrect: false },
      ],
    }
  ];

  for (const q of questionsData) {
    const createdQuestion = await prisma.question.create({
      data: {
        bankId: qBank.id,
        category: q.category,
        difficulty: q.difficulty,
        questionText: q.questionText,
        explanationText: q.explanationText,
        status: 'active',
      },
    });

    for (let i = 0; i < q.options.length; i++) {
      const opt = q.options[i];
      await prisma.questionOption.create({
        data: {
          questionId: createdQuestion.id,
          optionKey: opt.key,
          optionText: opt.text,
          isCorrect: opt.isCorrect,
          sortOrder: i + 1,
        },
      });
    }
  }

  console.log('Questions and options created successfully.');

  // 8. Create Exam
  console.log('Creating exam configuration...');
  const exam = await prisma.exam.create({
    data: {
      title: 'Ujian Uji Kompetensi Budaya & Etika Kerja',
      description: 'Ujian akhir evaluasi pemahaman budaya perusahaan SPECTRA, aturan etika kerja, dan kebijakan teknis pengerjaan ujian.',
      trainingModuleId: module.id, // Linked to the training module as a prerequisite!
      durationMinutes: 10,
      questionCount: 4, // Pull 4 questions out of 5
      shuffleQuestions: true,
      shuffleOptions: true,
      passScore: 75.0, // Passing grade: 75%
      availableFrom: new Date(Date.now() - 3600 * 1000), // Opened 1 hour ago
      availableUntil: new Date(Date.now() + 3600 * 24 * 1000), // Open until tomorrow
      allowReviewAfterSubmit: true,
      resultReleaseMode: 'full_review',
      status: 'published',
      createdById: instructor.id,
    },
  });

  // 9. Add Exam Question Rules
  console.log('Creating exam question rules...');
  await prisma.examQuestionRule.create({
    data: {
      examId: exam.id,
      bankId: qBank.id,
      category: 'Budaya Kerja',
      difficulty: 'Any',
      pickCount: 1,
    },
  });

  await prisma.examQuestionRule.create({
    data: {
      examId: exam.id,
      bankId: qBank.id,
      category: 'Protokol Ujian',
      difficulty: 'Any',
      pickCount: 1,
    },
  });

  await prisma.examQuestionRule.create({
    data: {
      examId: exam.id,
      bankId: qBank.id,
      category: 'Kode Etik',
      difficulty: 'Any',
      pickCount: 1,
    },
  });

  await prisma.examQuestionRule.create({
    data: {
      examId: exam.id,
      bankId: qBank.id,
      category: 'Sistem Teknis',
      difficulty: 'Any',
      pickCount: 1,
    },
  });

  // 10. Assign Exam to Candidate
  console.log('Assigning exam to candidate...');
  await prisma.examAssignment.create({
    data: {
      examId: exam.id,
      candidateId: candidate.id,
      assignedById: instructor.id,
      attemptLimit: 1,
      extraTimeMinutes: 0, // default
      status: 'assigned',
    },
  });

  console.log('--- Seeding Database Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
