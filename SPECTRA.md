# SPECTRA — Design System & Brand Guidelines

**Full Name:** SPECTRA — Skill, Performance, Evaluation, Candidate Training & Recruitment Assessment  
**Slogan:** Ukur Kompetensi, Pilih Talenta Terbaik  
**Product Classification:** LMS Ringan + Assessment Engine Khusus Rekrutmen  

---

## 1. Visual Theme & Atmosphere

SPECTRA is designed with a digital-first, technical product aesthetic. The visual system balances the requirements of a high-performance assessment tool with the educational focus of a training platform. It is native to both dark and light modes, taking direct inspiration from leading developer platforms:

*   **Linear.app (Obsidian Depth & Craftsmanship):** SPECTRA uses a dark obsidian base (`#030712`) for its dark theme, creating a low-fatigue workspace for long assessment sessions. Surfaces are layered using thin hairline borders and subtle elevation steps, emphasizing functional boundaries over shadow effects.
*   **Supabase (Developer-Centric Precision):** The grid structure, input fields, and status indicators employ high-contrast lines and monospace metadata accents. This establishes a sense of technical rigor, indicating that the platform is a serious, objective evaluation tool.
*   **Vercel (Typographic Compression & Workflow Accents):** Headings use tight letter-spacing for a modern, digital-native look. The platform is organized around workflow-specific accent colors representing distinct candidate stages: **Training** (Cognitive Blue), **Exam** (Chrono Pink), and **Evaluation** (Competence Green).

---

## 2. Color Palette & Roles

SPECTRA uses a highly structured color system defined in HSL and Hex. This allows for smooth transparency layering and consistent contrast ratios across light and dark modes.

### 2.1. Brand Core
*   **Aero Cyan** (`#00d8f6` / `hsl(187, 100%, 48%)`): Represents potential, skill discovery, and interactive energy. Used for active indicators, primary focus states, and progress nodes.
*   **Spectral Violet** (`#7c3aed` / `hsl(263, 90%, 60%)`): Represents intelligence, evaluation, and premium quality. Used for branding elements, completed milestones, and high-tier achievements.
*   **The Talent Spectrum:** A linear gradient from **Spectral Violet** to **Aero Cyan** is used for primary action CTAs and dashboard headers, symbolizing the transition from training to verified competence.

### 2.2. Workflow Accents (State-Based)
To guide the candidate through the application lifecycles, three distinct colors represent the core modules:
1.  **Training Module (Cognitive Blue):** `#2563eb` / `hsl(221, 83%, 53%)`. Represents learning, preparation, and steady progress.
2.  **Exam Engine (Chrono Pink):** `#ff0055` / `hsl(340, 100%, 50%)`. Represents active testing, urgency, and time-sensitive tasks. Used for timers, active exam attempts, and alert states.
3.  **Evaluation & Results (Competence Green):** `#10b981` / `hsl(162, 76%, 41%)`. Represents validation, successful passing of benchmarks, and completed assessments.

### 2.3. Theme Palette Variables

#### Dark Theme (Native Obsidian)
```css
:root[data-theme="dark"] {
  --color-canvas: #030712;          /* Deepest background void */
  --color-surface-1: #0b0f19;       /* Card & panel background (Layer 1) */
  --color-surface-2: #111827;       /* Input & nested component background (Layer 2) */
  --color-surface-3: #1f2937;       /* Hovered item background (Layer 3) */
  
  --color-border-subtle: #1f2937;   /* Default hairline grid borders */
  --color-border-strong: #374151;   /* Active borders, input outlines */
  
  --color-text-primary: #f9fafb;    /* High-contrast headings and body */
  --color-text-muted: #9ca3af;      /* Secondary descriptions and labels */
  --color-text-subtle: #6b7280;     /* Fine print, disabled states, metadata */
  
  --shadow-border: 0 0 0 1px rgba(255, 255, 255, 0.05);
  --shadow-elevation: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
}
```

#### Light Theme (Clean Slate)
```css
:root[data-theme="light"] {
  --color-canvas: #f8fafc;          /* Muted, high-brightness background */
  --color-surface-1: #ffffff;       /* Card & panel background (Layer 1) */
  --color-surface-2: #f1f5f9;       /* Input & nested component background (Layer 2) */
  --color-surface-3: #e2e8f0;       /* Hovered item background (Layer 3) */
  
  --color-border-subtle: #e2e8f0;   /* Default hairline grid borders */
  --color-border-strong: #cbd5e1;   /* Active borders, input outlines */
  
  --color-text-primary: #0f172a;    /* High-contrast headings and body */
  --color-text-muted: #475569;      /* Secondary descriptions and labels */
  --color-text-subtle: #94a3b8;     /* Fine print, disabled states, metadata */
  
  --shadow-border: 0 0 0 1px rgba(0, 0, 0, 0.05);
  --shadow-elevation: 0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -1px rgba(15, 23, 42, 0.02);
}
```

---

## 3. Typography & Hierarchy

The typography system is engineered for structure, technical precision, and readability. It enforces a strict weight hierarchy and tight tracking at display scales.

### 3.1. Font Families
*   **Primary Display & UI Sans:** **Plus Jakarta Sans** (alternative: *Outfit*, *Inter*). Selected for its modern geometric structures and clean rounded terminals.
*   **Technical & Monospace:** **JetBrains Mono** (alternative: *Geist Mono*, *Source Code Pro*). Used for countdown timers, question numbers, scores, progress percentages, and metadata tags.

### 3.2. Typographic Scale

| Role | Font Family | Size | Weight | Line Height | Letter Spacing | Use Cases |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display XL** | Plus Jakarta Sans | 40px (`2.5rem`) | 700 | 1.10 | `-0.05em` | Landing page titles, hero headers |
| **Display LG** | Plus Jakarta Sans | 32px (`2.0rem`) | 700 | 1.15 | `-0.04em` | Dashboard welcome, test completion |
| **Section Header**| Plus Jakarta Sans | 24px (`1.5rem`) | 600 | 1.25 | `-0.03em` | Module titles, panel headers |
| **Card Title** | Plus Jakarta Sans | 18px (`1.125rem`)| 600 | 1.35 | `-0.02em` | Lesson cards, exam list items |
| **Body Large** | Plus Jakarta Sans | 16px (`1.0rem`) | 400 | 1.60 | `normal` | Lesson text, long descriptions |
| **Body Small** | Plus Jakarta Sans | 14px (`0.875rem`)| 400 | 1.50 | `normal` | UI labels, instructions, option text |
| **UI Interactive** | Plus Jakarta Sans | 14px (`0.875rem`)| 500 | 1.20 | `normal` | Buttons, navigation links, tabs |
| **Technical Mono** | JetBrains Mono | 14px (`0.875rem`)| 500 | 1.20 | `normal` | Question counters, timer display |
| **Metadata Tag** | JetBrains Mono | 11px (`0.688rem`)| 600 | 1.00 | `0.05em` | Status tags (`uppercase`) |

### 3.3. Typographic Principles
1.  **Tabular Numbers for Timers:** Countdown timers must use the CSS rule `font-variant-numeric: tabular-nums` or be set in JetBrains Mono. This prevents layout jitter as numbers change.
2.  **Tracking Compression:** Headings (sizes 18px and above) must apply negative tracking (`tracking-tight`) to maintain a unified, technical product appearance.
3.  **Strict Weights:** Utilize only weights 400 (regular reading), 500 (interactive items), and 700 (headings/emphasis) to maintain clean visual layouts.

---

## 4. Layout & Grid Principles

SPECTRA uses a structured, low-noise layout engine focused on content delivery.

*   **Grid Structure:** A 12-column layout for dashboard views, collapsing to 1 column for active exam attempts to remove distractions.
*   **Symmetry & Dividers:** Section divisions use solid 1px hairline borders (`var(--color-border-subtle)`) instead of heavy background differences. This creates a clean, clinical workspace.
*   **Responsive Adaptation:** Panels stack vertically on mobile screens. Navigation menus transition into a bottom navigation bar on mobile to ensure ease of access during mobile-friendly lessons.

---

## 5. Component Patterns (Tailwind & CSS Specifications)

Below are the visual specifications for key components in the SPECTRA ecosystem.

### 5.1. Primary Talent Gradient Button
Used for final exam submissions and starting assigned modules. It uses a gradient background with an interactive glow effect.

```html
<!-- HTML & Tailwind Specification -->
<button class="relative group overflow-hidden rounded-lg p-[1px] focus:outline-none focus:ring-2 focus:ring-cyan-400">
  <!-- Inner Glow Layer -->
  <span class="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-500 rounded-lg group-hover:opacity-100 transition-opacity duration-300"></span>
  <!-- Button Content -->
  <div class="relative px-6 py-3 bg-slate-950 rounded-[7px] transition-colors duration-300 group-hover:bg-transparent">
    <span class="font-sans text-sm font-medium text-white tracking-wide">
      Mulai Ujian Kompetensi
    </span>
  </div>
</button>
```

### 5.2. Active Timed Exam Status Card
Displays active assessment parameters. It features a technical layout with metadata tags.

```html
<!-- HTML & Tailwind Specification -->
<div class="w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
  <div class="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
    <div class="flex items-center space-x-3">
      <span class="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
      <h3 class="font-sans font-semibold text-lg text-white">Ujian Akhir: Kompetensi Teknis</h3>
    </div>
    <span class="font-mono text-xs font-semibold uppercase tracking-wider bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-full border border-pink-500/20">
      Exam Active
    </span>
  </div>
  
  <div class="grid grid-cols-3 gap-4 text-center">
    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
      <p class="font-sans text-xs text-slate-400">Waktu Tersedia</p>
      <p class="font-mono text-lg font-bold text-white mt-1">45 Mnt</p>
    </div>
    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
      <p class="font-sans text-xs text-slate-400">Jumlah Soal</p>
      <p class="font-mono text-lg font-bold text-white mt-1">40 Soal</p>
    </div>
    <div class="bg-slate-950 p-3 rounded-lg border border-slate-800/50">
      <p class="font-sans text-xs text-slate-400">Passing Grade</p>
      <p class="font-mono text-lg font-bold text-emerald-400 mt-1">75%</p>
    </div>
  </div>
</div>
```

### 5.3. Sticky Exam Timer Bar
A persistent countdown component that floats at the top of the exam screen. Its visual state shifts dynamically as time runs out.

```html
<!-- State 1: Normal State (>5 minutes remaining) -->
<div class="sticky top-0 z-50 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 py-3 px-6 flex items-center justify-between transition-colors duration-500">
  <div class="flex items-center space-x-4">
    <span class="font-sans text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate: Farhan Gunawan</span>
    <span class="text-slate-700">|</span>
    <span class="font-sans text-xs text-slate-400">Progres: 12 dari 40 Soal</span>
  </div>
  <div class="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-lg">
    <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    <span class="font-mono text-sm font-bold text-white tracking-widest tabular-nums">28:42</span>
  </div>
</div>

<!-- State 2: Urgent Alert State (<5 minutes remaining) -->
<!-- The background changes to a dark red tint, the border changes to red, and the icon pulses -->
<div class="sticky top-0 z-50 w-full bg-red-950/40 backdrop-blur-md border-b border-red-500/30 py-3 px-6 flex items-center justify-between transition-colors duration-500">
  <div class="flex items-center space-x-4">
    <span class="font-sans text-xs font-semibold text-red-300 uppercase tracking-wider">WAKTU HAMPIR HABIS</span>
    <span class="text-red-900/40">|</span>
    <span class="font-sans text-xs text-red-300">Harap segera menyelesaikan jawaban Anda</span>
  </div>
  <div class="flex items-center space-x-2 bg-red-500/10 border border-red-500/40 px-4 py-1.5 rounded-lg animate-pulse">
    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
    <span class="font-mono text-sm font-bold text-red-400 tracking-widest tabular-nums">04:19</span>
  </div>
</div>
```

### 5.4. Training Module with Completion Gate
Represents a course module showing status and progress. It contains a completion gate that locks or unlocks the exam depending on the candidate's completion status.

```html
<!-- HTML & Tailwind Specification -->
<div class="bg-slate-900 border border-slate-800 rounded-xl p-6 transition-all hover:border-slate-700">
  <div class="flex items-start justify-between mb-4">
    <div>
      <span class="font-mono text-[10px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
        Modul 01: Fondasi Kerja
      </span>
      <h3 class="font-sans font-semibold text-lg text-white mt-2">Budaya Perusahaan & Etika Profesional</h3>
    </div>
    <!-- Progress Circular Node -->
    <div class="flex items-center space-x-2">
      <span class="font-mono text-sm font-semibold text-slate-300">100%</span>
      <span class="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/40">
        <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
      </span>
    </div>
  </div>
  
  <p class="font-sans text-sm text-slate-400 mb-6">
    Pelajari visi, misi, nilai-nilai organisasi, serta standar perilaku profesional yang diharapkan dari seluruh karyawan baru.
  </p>
  
  <div class="flex items-center justify-between border-t border-slate-800/60 pt-4">
    <span class="font-sans text-xs text-slate-400">4 Pelajaran Terbaca • 1 Ujian Terkait</span>
    <!-- Exam Button (Unlocked due to 100% progress) -->
    <a href="#" class="inline-flex items-center space-x-1.5 font-sans text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
      <span>Masuk ke Ujian</span>
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
    </a>
  </div>
</div>
```

---

## 6. UX Integrity Policies

### 6.1. Timer Otoritatif di Server
To maintain testing integrity, client-side clocks are used solely for visual rendering:
1.  **Attempt Initialization:** When a candidate starts a test, the backend generates an `exam_attempts` database record. It calculates `started_at` and a fixed `ends_at` based on the exam duration.
2.  **Countdown Calculation:** The frontend timer calculates remaining time by comparing the current server time (`server_now`) with `ends_at`. The countdown cannot be paused, reset, or bypassed by page refreshes or device changes.
3.  **Graceful Expiration (Auto-Submit):**
    *   Once `ends_at` is reached, the server locks inputs for that attempt.
    *   The frontend intercepts any further interactions, displays a "Waktu Ujian Habis" notification, and triggers an automated submission.
    *   The user is redirected to a confirmation page or results page according to the exam policy.

### 6.2. Dual-Tab Prevention
To prevent multiple windows from modifying the same attempt:
1.  The application uses the `BroadcastChannel` API named `spectra_exam_session`.
2.  Upon page load on an active exam route, the application sends a handshake message.
3.  If another tab replies with an active state message, the newer tab overlays a blocking screen: *"Sesi ujian aktif terdeteksi di jendela lain. Harap gunakan satu jendela saja."* and disables inputs.

### 6.3. Interactive Micro-Save
*   To prevent data loss from network instability, a candidate's selected options are saved automatically via background API requests (`POST /attempts/{id}/answers`) upon selecting an answer.
*   A small status indicator, **"Tersimpan di Cloud"**, appears in the bottom right corner as a confirmation.

---

## 7. Exam Scheduling & Lifecycle States (Manajemen & Visualisasi Jadwal)

Sistem evaluasi SPECTRA sangat bergantung pada ketepatan waktu. Bagian ini mendefinisikan status visual dan aturan interaksi untuk seluruh siklus penjadwalan ujian (`available_from`, `available_until`, dan perubahan jadwal).

### 7.1. Empat Status Jadwal Ujian (Candidate View)

Setiap ujian yang ditugaskan kepada kandidat harus berada dalam salah satu dari empat status visual berikut:

#### 1. Status: Belum Mulai (Upcoming Schedule)
*   **Kondisi:** Waktu server saat ini < `available_from`.
*   **Indikator Visual:** Border luar abu-abu gelap, dengan badge status berwarna kuning/biru redup bertuliskan `Belum Dimulai`.
*   **Interaksi:** Tombol "Mulai Ujian" dinonaktifkan (disabled) dengan ikon gembok. Menampilkan hitung mundur (countdown) menuju waktu mulai.

#### 2. Status: Jendela Terbuka (Active Schedule)
*   **Kondisi:** `available_from` ≤ Waktu server saat ini ≤ `available_until`.
*   **Indikator Visual:** Menggunakan aksen **Aero Cyan** atau **Chrono Pink** dengan indikator dot berkedip (pulsing green/pink dot) yang menandakan ujian siap diakses.
*   **Interaksi:** Tombol "Mulai Ujian" aktif penuh menggunakan gradien warna utama (**The Talent Spectrum**).

#### 3. Status: Terlewat / Selesai (Expired / Closed Schedule)
*   **Kondisi:** Waktu server saat ini > `available_until` (dan kandidat belum memulai/menyelesaikan).
*   **Indikator Visual:** Keseluruhan kartu diredupkan (opacity 60%), menggunakan warna border abu-abu mati. Badge bertuliskan `Selesai / Kadaluarsa`.
*   **Interaksi:** Tombol dinonaktifkan dan teks berubah menjadi "Akses Jadwal Berakhir". Menampilkan catatan instruksi untuk menghubungi pemateri/admin jika memerlukan jadwal susulan.

#### 4. Status: Jadwal Berubah / Diperpanjang (Rescheduled / Updated)
*   **Kondisi:** Parameter `available_from` atau `available_until` diubah oleh pemateri/admin setelah jadwal awal diterbitkan.
*   **Indikator Visual:** Menampilkan badge highlight **"Jadwal Diperbarui"** berwarna amber/emas di bagian atas kartu. Menampilkan visualisasi perubahan waktu lama ke waktu baru.
*   **Interaksi:** Memunculkan notifikasi toast atau banner informasi saat kandidat pertama kali membuka dashboard untuk memastikan mereka menyadari perubahan tersebut.

---

### 7.2. Spesifikasi Komponen Penjadwalan (HTML & Tailwind)

#### A. Komponen Jadwal Ujian Belum Mulai (Upcoming)
```html
<div class="bg-slate-900 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden">
  <!-- Status Badge -->
  <div class="flex justify-between items-start mb-4">
    <span class="font-mono text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
      Belum Mulai
    </span>
    <div class="flex items-center space-x-1.5 text-slate-400 font-mono text-xs">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span>Mulai dalam: 02j 14m 05d</span>
    </div>
  </div>

  <h3 class="font-sans font-semibold text-base text-slate-300">Ujian Kemampuan Kognitif & Logika</h3>
  <p class="font-sans text-xs text-slate-500 mt-1">Jadwal Mulai: 26 Juni 2026, 09:00 WIB</p>

  <!-- Disabled Button with Lock Icon -->
  <button disabled class="w-full mt-5 py-2.5 bg-slate-950 border border-slate-800/60 rounded-lg flex items-center justify-center space-x-2 cursor-not-allowed">
    <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
    <span class="font-sans text-xs font-medium text-slate-600">Mulai Ujian (Terkunci)</span>
  </button>
</div>
```

#### B. Komponen Jadwal Berubah / Diundur (Rescheduled Alert Card)
```html
<div class="bg-slate-900 border border-amber-500/30 rounded-xl p-6 relative overflow-hidden">
  <!-- Top decorative light indicator -->
  <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-500 to-amber-500/20"></div>
  
  <div class="flex justify-between items-start mb-3">
    <span class="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider flex items-center space-x-1">
      <span class="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
      <span>Jadwal Diperbarui</span>
    </span>
    <span class="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase">
      Aktif
    </span>
  </div>

  <h3 class="font-sans font-semibold text-base text-white">Ujian Karakter & Kepribadian Kerja</h3>
  
  <!-- Visualizing schedule changes -->
  <div class="my-4 p-3 bg-slate-950 rounded-lg border border-slate-800/60 flex items-center justify-between">
    <div class="text-left">
      <span class="block text-[10px] text-slate-500 uppercase">Jadwal Semula</span>
      <span class="font-mono text-xs text-slate-400 line-through">25 Jun, 10:00 WIB</span>
    </div>
    <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
    <div class="text-right">
      <span class="block text-[10px] text-amber-400 uppercase font-semibold">Jadwal Baru</span>
      <span class="font-mono text-xs text-white font-bold">25 Jun, 13:00 - 15:00 WIB</span>
    </div>
  </div>

  <!-- Active button with secondary style -->
  <button class="w-full py-2.5 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 rounded-lg text-white font-sans text-xs font-semibold tracking-wide transition-all duration-300">
    Konfirmasi & Mulai Ujian
  </button>
</div>
```

---

### 7.3. Kontrol Penjadwalan & Akomodasi Waktu (Admin & Instructor View)

Untuk mengelola jadwal secara fleksibel, pemateri dan admin dibekali kontrol berikut di halaman backoffice:

1.  **Global Schedule Adjustment:** Form input dengan format kalender lokal dan zona waktu server yang deterministik untuk mengubah batas `available_from` dan `available_until` seluruh kandidat.
2.  **Akomodasi Waktu Individu (Candidate-Specific Override):**
    *   Admin dapat menambahkan parameter `extra_time_minutes` pada tabel `exam_assignments` khusus untuk kandidat tertentu (misalnya, akomodasi disabilitas atau kendala teknis resmi).
    *   Sistem secara otomatis menghitung `ends_at = started_at + duration_minutes + extra_time_minutes` di tingkat database tanpa mengganggu kandidat lain.
3.  **Audit Log Perubahan Jadwal:**
    *   Setiap perubahan jadwal wajib mencatat log pada tabel `audit_logs` dengan menyimpan format JSON perubahan: `{"exam_id": 1, "old_until": "2026-06-25 12:00:00", "new_until": "2026-06-25 15:00:00", "reason": "Sistem diundur"}`.
