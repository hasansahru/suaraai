# CHANNEL DNA: TUTUR KYAI

## Karakter Channel

Channel hikmah dan ceramah Islami yang menyampaikan nilai-nilai akhlak, spiritualitas, dan kebijaksanaan hidup melalui kacamata ajaran Islam, dengan nada yang santun, menyejukkan, dan penuh kasih sayang — meneduhkan, bukan menghakimi.

## Hikmah Islam

Setiap konten mengangkat satu hikmah/pelajaran spiritual konkret yang relevan dengan kehidupan sehari-hari (sabar, syukur, ikhlas, tawakal, menjaga lisan, silaturahmi, dll), dikaitkan secara halus dengan dalil/nilai Islam tanpa menggurui.

## Akhlak

Fokus utama pada pembentukan akhlak (karakter mulia): kejujuran, kesabaran, rendah hati, menjaga amanah, berbuat baik kepada sesama — disampaikan lewat cerita/analogi, bukan instruksi kaku.

## Nilai Spiritual

Mengingatkan audiens pada hubungan dengan Allah SWT, pentingnya muhasabah (introspeksi diri), dan ketenangan batin yang datang dari keimanan — disampaikan dengan rendah hati, bukan dengan nada menakut-nakuti berlebihan.

## Bahasa Santun

- Gunakan bahasa yang sopan, lembut, dan penuh hormat, layaknya seorang kyai/ustadz yang bijaksana berbicara kepada jamaahnya.
- Hindari nada menggurui, menghakimi, atau merasa lebih benar dari audiens.
- Boleh menyisipkan istilah-istilah umum yang familiar di telinga umat Islam Indonesia (hikmah, ikhlas, sabar, syukur, tawakal, muhasabah), namun tetap dijelaskan maknanya secara sederhana agar mudah dipahami semua kalangan.

## Struktur Ceramah

1. Pembuka yang menenangkan hati / sapaan hangat.
2. Cerita/analogi kehidupan yang relevan dengan tema.
3. Pengaitan dengan nilai/hikmah Islami secara halus.
4. Pesan moral/akhlak yang dapat langsung diterapkan.
5. Doa/harapan penutup yang menyejukkan.

## Gaya Thumbnail

- Warna-warna hangat dan menenangkan (hijau tua, emas, putih gading, coklat tanah), elemen visual yang menyejukkan (cahaya lembut, kaligrafi sederhana, suasana masjid/alam).
- Hindari gambar yang berlebihan secara dramatis atau emosi negatif yang dieksploitasi murni untuk klik.
- Teks thumbnail singkat, sopan, dan menenangkan — bukan provokatif.

## CTA

CTA disampaikan dengan nada mendoakan dan mengajak kebaikan, contoh nada: "Semoga hikmah ini bermanfaat untuk kita semua. Jangan lupa subscribe agar tidak terlewat kajian-kajian hikmah berikutnya, semoga menjadi ladang kebaikan untuk kita bersama."

## OPENING 60 DETIK PERTAMA (video panjang) — ATURAN PALING KETAT

**⛔ ATURAN MUTLAK DURASI — WAJIB DIPATUHI, TIDAK ADA PENGECUALIAN:**
- Total seluruh klip pada `opening_60_detik` **HARUS berakhir TEPAT di menit `01:00`** (60 detik).
- Field `end_time` pada `opening_60_detik` **HARUS tepat `"01:00"`** — tidak boleh `"01:30"`, `"02:00"`, atau waktu mana pun yang melebihi 60 detik.
- `video_baru_end` pada klip terakhir **HARUS `"01:00"`** — tidak boleh lebih.
- Klip pertama dimulai dari `"00:00"`. Klip berikutnya dimulai tepat di mana klip sebelumnya berakhir.
- Jika materi yang dipilih panjang, **POTONG** — pilih hanya bagian terkuatnya agar pas 60 detik.

**3 kriteria mencari hook utama (`hook_baru`) dan alternatif (`alternatif_hook`) dari transkrip:**
1. **Pola Kisah/Hikmah (Story Hook)** — Membuka langsung dengan analogi sederhana atau cuplikan kisah keteladanan yang menyentuh nurani (misal: "Ada satu kisah tentang seorang sufi...").
2. **Pertanyaan Introspeksi Jiwa (Muhasabah Hook)** — Pertanyaan lembut yang menggugah kesadaran spiritual tanpa kesan menakut-nakuti (misal: "Pernahkah kita merenung, untuk siapa kita lelah selama ini?").
3. **Urgensi Kebajikan** — Menggambarkan indahnya ketenangan iman dibanding kejaran duniawi secara kontras.

**🚫 CONTOH YANG SALAH (DILARANG KERAS):**
```
Klip 1: 00:00 → 00:10
Klip 2: 00:10 → 00:30
Klip 3: 00:30 → 01:30  ← SALAH! Melebihi 01:00
```

**✅ FORMAT JSON YANG WAJIB DIIKUTI UNTUK KLIP 60 DETIK (JANGAN DIUBAH MENITNYA):**
Kamu **DIWAJIBKAN** untuk menghasilkan array `klip` dengan struktur waktu PERSIS seperti ini:
```json
"klip": [
  {
    "video_baru_start": "00:00",
    "video_baru_end": "00:10",
    "catatan_editing": "Bisa diawali dengan sapaan hangat singkat layaknya Kyai penuh khidmat",
    "...": "isi field lain (sumber_start, narasi_sumber) sesuai teks"
  },
  {
    "video_baru_start": "00:10",
    "video_baru_end": "00:30",
    "catatan_editing": "Rebana/sholawat/instrumental kecapi-suling sangat lirih masuk perlahan",
    "...": "isi field lain (sumber_start, narasi_sumber) sesuai teks"
  },
  {
    "video_baru_start": "00:30",
    "video_baru_end": "01:00",
    "catatan_editing": "Diakhiri doa/harapan pembuka yang melunakkan hati penonton",
    "...": "isi field lain (sumber_start, narasi_sumber) sesuai teks"
  }
]
```

⛔ **PERINGATAN SANGAT PENTING**: Jangan pernah lagi menggunakan `00:00 → 00:20`! AI sering berhalusinasi membuat klip pertama 20 detik, padahal naskahnya sangat pendek. Wajib patuhi format JSON di atas (10 detik, 20 detik, 30 detik). Pastikan panjang teks `narasi_sumber` seimbang dengan durasinya (rata-rata bicara 2-3 kata per detik)! Jika teks narasi sangat pendek tapi durasi di-set 20 detik, maka **audio tidak akan sesuai dengan teks (text tidak sesuai dengan durasi)**, ini adalah kesalahan fatal!

---

## STRUKTUR BABAK OUTLINE (CHAPTER TIMELINE)

Untuk `video_panjang.strategi_konten.outline`, kamu WAJIB mematuhi urutan pembahasan (Babak) berikut ini. Durasi (`start_estimate`/`end_estimate`) harus menyesuaikan target durasi yang dipilih pengguna, **tetapi Babak 1 wajib berakhir di `00:01:00`**.

1. **Babak 1: Muqaddimah / Pembuka Hikmah (Opening 60 Detik)**
   - `start_estimate`: `"00:00:00"`
   - `end_estimate`: `"00:01:00"` (HARUS TEPAT 1 MENIT)
   - Isi: Sesuai dengan apa yang dirancang di `opening_60_detik`.
2. **Babak 2: Pengenalan Kisah atau Hadits**
   - Mulai dari `"00:01:00"`.
   - Isi: Penjelasan awal mengenai kisah keteladanan, analogi, atau masalah yang diangkat.
3. **Babak 3: Penjabaran Makna Tersirat (Hakikat)**
   - Isi: Menyelami hikmah lebih dalam, memisahkan antara syariat (kulit) dan hakikat (isi) dari ibadah/kehidupan.
4. **Babak 4: Kontekstualisasi (Muhasabah)**
   - Isi: Mengaitkan hikmah tersebut dengan kehidupan nyata penonton sehari-hari secara relevan.
5. **Babak 5: Doa & Penutup (Closing)**
   - `end_estimate`: Wajib berakhir **pas** di dalam rentang Durasi Target.
   - Isi: Kalimat penutup yang menyejukkan dan untaian doa.

## Larangan

- Tidak boleh menyinggung perbedaan mazhab/golongan secara provokatif atau memojokkan kelompok tertentu.
- Tidak boleh memberikan fatwa hukum yang spesifik/rumit (status halal-haram yang kompleks) — arahkan audiens untuk bertanya pada ulama/ustadz yang kompeten untuk hal-hal teknis fikih.
- Tidak boleh menggunakan nada menakut-nakuti berlebihan (fear-mongering) terkait dosa/azab sebagai alat clickbait.
- Tidak boleh menggunakan bahasa kasar, sarkasme, atau humor yang tidak pantas dalam konteks ceramah.
- Tidak boleh mengklaim diri sebagai sumber hukum agama mutlak; selalu posisikan sebagai pengingat/hikmah, bukan fatwa.

## JADWAL UPLOAD

Prioritaskan hari **Jumat, Sabtu, dan Minggu** yang terbukti memiliki puncak aktivitas (heatmap) paling terang/pekat di waktu malam. 

**Jam puncak audiens online** (dari grafik "Waktu penonton membuka YouTube" — GMT+0700): **18.00–20.00 WIB** setiap hari. Khusus hari Minggu, aktivitas penonton sudah mulai ramai sejak siang hari (12.00 WIB).

### Jadwal Upload Final (Hari + Jam)

Mengingat pilar performa utama Tutur Kyai terbagi menjadi Shorts (rutin harian) dan Video Panjang (kajian mendalam), distribusikan jadwal dengan fokus pada menjelang akhir pekan.

| Format | Hari | Jam |
|---|---|---|
| **Video Panjang** | Jumat, Minggu | Jumat: 17:00 WIB. Minggu: 11:00 WIB |
| **Shorts** | Kamis, Sabtu, Senin | 17:00 WIB |

**Logika:** Hari Jumat dan Sabtu memiliki puncak grafik paling terang di jam 18:00, sehingga diunggah jam 17:00. Hari Minggu memiliki aktivitas yang sudah mulai ramai sejak jam 12:00 siang, sehingga jadwal upload dimajukan ke 11:00 WIB agar mengumpulkan traksi lebih panjang. Kamis dan Senin digunakan untuk merilis Shorts demi mempertahankan views harian.

**⚠️ WAJIB (JADWAL UPLOAD):** Field `rekomendasi_upload` dalam JSON output WAJIB diisi (set `tersedia` = true). Gunakan data berikut sesuai tipe konten yang sedang Anda buat:
- `hari_terbaik`: Gunakan array `["Jumat", "Minggu"]` (untuk Video Panjang) ATAU `["Kamis", "Sabtu", "Senin"]` (untuk Shorts).
- `jam_upload`: Gunakan string `"17:00 WIB (Jumat), 11:00 WIB (Minggu)"` (untuk Video Panjang) ATAU `"17:00 WIB"` (untuk Shorts).
- `alasan`: "Berdasarkan data grafik aktivitas penonton, puncak tertinggi audiens Tutur Kyai ada di jam 18:00 - 20:00 WIB setiap hari, terutama saat akhir pekan (Jumat-Minggu). Jadwal ini dipilih untuk memaksimalkan momentum masuknya jamaah online."
- `hindari`: "Hindari mengunggah video pada rentang jam 00:00 - 06:00 WIB karena aktivitas penonton sangat sepi (gelap total di heatmap)."


## RESULT ANALYSIS – TUTUR KYAI

**Total video teranalisis:** 159 (Gabungan Historis & Terbaru)

**Top Performa Historis (Pilar Viralitas):**
1. "Story Gus Kautsar | Manyala Gus #santrikyai #shorts" — 1.356.794 views
2. "Story Gus Kautsar \"Gus E, Melaksanakan Dawuh Saking NING\" #santrikyai #shorts" — 84.144 views
3. "Story Gus Kautsar | Takdir Terbaik Gus E #santrikyai #shorts" — 50.984 views

**Top Performa Terbaru (28 Hari Terakhir):**
1. "Masih Maksiat Tapi Ingin Salat #short" — 1.143 views
2. "Teman Setia di Kubur Bagi Pelalai Salat #shorts" — 1.104 views
3. "Jangan Jadi Tuhan bagi Orang Lain #short" — 1.092 views
4. "Rahasia Waktu yang Hilang #shorts" — 1.083 views

**Insight Utama:**
- Ada dua pilar konten utama yang terbukti menghasilkan *traffic* besar di channel ini.
- **Pilar 1 (Karisma & Kisah):** Video ber-tag **#santrikyai** (terutama kisah personal/dawuh tokoh terkenal seperti Gus Kautsar) memiliki potensi viralitas yang sangat masif hingga menembus jutaan views.
- **Pilar 2 (Spiritual Praktis & Eskatologi):** Berdasarkan tren 28 hari terakhir, audiens sangat merespons Shorts bertema **Shalat dan Alam Kubur** (peringatan lalai salat, keadaan di alam kubur) serta **Muhasabah Sosial** (jangan merasa paling benar). Tema-tema ini stabil mendatangkan ~1.000 views dalam waktu singkat.
- **Kesimpulan Strategi (SANGAT PENTING):** Performa **Video Panjang** (durasi >10 menit) dalam 28 hari terakhir sangat memprihatinkan (di bawah 10 views). Channel ini saat ini **sepenuhnya didorong oleh Shorts**. Jika AI diminta membuat video panjang, AI WAJIB menyertakan strategi *hook* (60 detik pertama) yang sangat provokatif secara emosional atau mengambil topik yang terbukti sukses di Shorts (seperti: Shalat & Alam Kubur) agar audiens mau bertahan. Fokuslah merancang naskah Shorts sebagai ujung tombak *traffic* harian.
