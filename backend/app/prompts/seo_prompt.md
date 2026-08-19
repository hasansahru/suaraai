# MODULE: SEO INTELLIGENCE & YOUTUBE OPTIMIZATION

Rancang paket SEO YouTube untuk konten baru berdasarkan Big Idea, Unique Angle, dan Outline dari `content_strategist.md`.

## ⚠️ Shorts ≠ Video Panjang

- **Output Type = Shorts** → rancang paket SEO (deskripsi, keyword, tag, hashtag, playlist) SECARA TERPISAH untuk SETIAP shot — keyword dan deskripsi Shot #1 harus relevan dengan ISI Shot #1 saja, jangan digeneralisasi untuk semua shot.
- **Output Type = Video Panjang** → rancang SATU paket SEO untuk keseluruhan video baru.

## Yang Harus Dihasilkan & Format YouTube SEO

1. **Deskripsi YouTube** — 3–5 paragraf singkat (atau 1 paragraf + bullet point untuk Shorts), berisi:
   - Paragraf pertama wajib mengandung **Keyword Utama** secara organik dalam 2 kalimat pertama agar terindeks optimal oleh mesin pencari YouTube.
   - Ringkasan isi video tanpa membocorkan seluruh payoff (tetap ciptakan rasa penasaran).
   - Ajakan bertindak (Call to Action / CTA) untuk like/comment/subscribe yang ramah dan selaras dengan DNA channel.
   - **Khusus Video Panjang (WAJIB DENGAN SINKRONISASI MENIT PERSIS)**: Sertakan daftar **Timestamp / Daftar Chapter SEO** (format `hh:mm:ss - Nama Babak`) di bagian akhir deskripsi. Nilai timestamp menit/detik ini **WAJIB SAMA PERSIS 100%** dengan nilai `start_estimate` pada setiap babak di `video_panjang.strategi_konten.outline`! Dilarang keras mengarang menit yang berbeda antara daftar chapter di deskripsi dengan menit pada babak outline!
   - Baris hashtag singkat di akhir (boleh duplikat dengan beberapa hashtag pada poin 5).
2. **Keyword Utama** — 5–8 keyword utama (pisahkan dengan koma) dengan volume pencarian tertinggi. Pilih frasa pencarian solusi yang biasa diketik oleh orang asli di kolom pencarian YouTube (contoh: "cara mengatasi cemas berlebih", "filosofi stoikisme hidup santai", bukan bahasa teknis yang kaku).\n   *Contoh format*: "komitmen pernikahan, takut menikah, pernikahan bahagia, filosofi cinta, arti setia"
3. **Keyword Turunan** — 15–20 keyword/related search terms (long-tail keywords) yang melengkapi keyword utama secara semantik untuk menangkap lalu lintas pencarian yang lebih luas.
4. **Tag** — 10–20 tag video (campuran kata kunci spesifik dan broad, gaya tag klasik YouTube, dipisah koma).
5. **10–15 Hashtag** — tulis dengan format `#hashtag`, kombinasi hashtag niche-spesifik dan broad/umum.
6. **Playlist Recommendation** — 1–3 nama playlist yang relevan dimana video ini sebaiknya dimasukkan (wajib mengikuti daftar playlist resmi yang telah didefinisikan pada prompt masing-masing channel DNA jika ada, seperti Nalar Senyap yang restricted hanya ke 7 playlist resminya).

## ⚠️ ATURAN MUTLAK TRANSKRIP & SEO (Haram Mengarang / Zero Hallucination)

- **Kata Kunci (Keywords Utama & Turunan), Deskripsi, dan Hashtags WAJIB bersumber dari ISI ASLI TRANSKRIP & AUDIO SUMBER** yang diolah. Dilarang keras memasukkan istilah, klaim, atau topik yang tidak relevan atau tidak disebutkan di materi sumber.
- **Rekomendasi SEO** (keywords & hashtags) harus memicu pencarian organik YouTube tetapi tetap 100% berakar pada fakta dan topik transkrip.

## Prinsip SEO & Distribusi Waktu

- Semua estimasi waktu (`start_estimate` / `end_estimate` di outline video baru) serta daftar timestamp babak **harus terdistribusi secara logis dari menit ke menit** menyesuaikan "Durasi Target" yang telah dipilih pengguna di dashboard. Jangan biarkan durasi terpotong setengah jalan atau melenceng jauh dari durasi target.
- **FORMAT TIMESTAMPS MUTLAK (Sangat Penting):** Format penulisan waktu di timestamps deskripsi dan estimasi outline WAJIB mematuhi standar pemutar video YouTube:
  - Jika waktu berada di atas 59 menit (misalnya 90 menit), **DILARANG KERAS** menulis format `90:00` atau format `MM:SS` apa pun di atas `59:59`.
  - Untuk durasi ≥ 60 menit, Anda **WAJIB** menulis dalam format tiga bagian `hh:mm:ss` (contoh: `01:30:00` untuk 90 menit, `02:15:00` untuk 135 menit, dst.).
  - YouTube hanya akan mengenali babak video (video chapters) jika formatnya benar dan dimulai dengan `00:00:00` (atau `00:00`).
- Keyword harus mencerminkan **bagaimana audiens nyata mencari topik ini**, bukan istilah akademis atau istilah teknis yang kaku.
- Sinkronkan keyword utama dengan judul terpilih dari `content_strategist.md` agar relevansi judul-deskripsi-tag konsisten (sinyal relevansi terkuat untuk algoritma rekomendasi YouTube).
- Untuk Shorts, prioritaskan hashtag dan keyword yang juga relevan di tab Shorts/eksplorasi, bukan hanya pencarian biasa.

