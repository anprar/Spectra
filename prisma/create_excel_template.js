const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const data = [
  {
    "Pertanyaan": "Siapakah penemu jaringan World Wide Web (WWW)?",
    "Pilihan A": "Bill Gates",
    "Pilihan B": "Steve Jobs",
    "Pilihan C": "Tim Berners-Lee",
    "Pilihan D": "Linus Torvalds",
    "Pilihan E": "Dennis Ritchie",
    "Kunci Jawaban": "C",
    "Pembahasan": "Tim Berners-Lee menemukan WWW pada tahun 1989 saat bekerja di CERN.",
    "Kategori": "Teknologi Informasi",
    "Tingkat Kesulitan": "Easy"
  },
  {
    "Pertanyaan": "Di antara pilihan berikut, manakah cara kerja timer ujian online yang aman menurut standar SPECTRA?",
    "Pilihan A": "Timer diatur di frontend browser agar hemat memori server.",
    "Pilihan B": "Timer diawasi secara otoritatif di server dengan mencatat jam selesai (ends_at) secara absolut.",
    "Pilihan C": "Kandidat diperbolehkan pause timer jika ingin istirahat.",
    "Pilihan D": "Timer dihitung berdasarkan jumlah karakter jawaban yang diketik.",
    "Pilihan E": "Timer dikirim setiap 5 menit melalui email.",
    "Kunci Jawaban": "B",
    "Pembahasan": "Timer server-authoritative mencegah manipulasi waktu pengerjaan di sisi browser kandidat.",
    "Kategori": "Protokol Ujian",
    "Tingkat Kesulitan": "Medium"
  }
];

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Templat Soal");

// Set clean column widths for the Excel template
const colWidths = [
  { wch: 50 }, // Pertanyaan
  { wch: 20 }, // Pilihan A
  { wch: 20 }, // Pilihan B
  { wch: 20 }, // Pilihan C
  { wch: 20 }, // Pilihan D
  { wch: 20 }, // Pilihan E
  { wch: 15 }, // Kunci Jawaban
  { wch: 40 }, // Pembahasan
  { wch: 20 }, // Kategori
  { wch: 15 }  // Tingkat Kesulitan
];
worksheet['!cols'] = colWidths;

const outputPath = path.join(publicDir, 'template_soal.xlsx');
xlsx.writeFile(workbook, outputPath);
console.log('Template Excel berhasil dibuat di:', outputPath);
process.exit(0);
