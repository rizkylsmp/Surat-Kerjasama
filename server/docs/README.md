# Aplikasi Surat Perjanjian Kerja Harian Lepas

Frontend ada di folder `client`, backend ada di folder `server`.

## Setup Client

```bash
cd client
npm install
npm run dev
```

Client berjalan di `http://localhost:5173`.

## Setup Server

```bash
cd server
copy .env.example .env
npm install
npm run migrate
npm run dev
```

Server berjalan di `http://localhost:4000`.

## Admin

Halaman admin:

```text
http://localhost:5173/admin
```

Untuk membuat akun admin pertama, isi `server/.env`:

```bash
SESSION_SECRET=isi-dengan-random-panjang
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password-kuat
```

Lalu jalankan di folder `server`:

```bash
npm run migrate
```

Admin memakai cookie sesi HTTP-only dan endpoint admin menolak akses tanpa login.

## Cloudinary

Untuk deployment Vercel serverless, gambar TTD dan wajah diupload ke Cloudinary. Isi environment server:

```bash
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_FOLDER=surat-kerjasama
```

Foto wajah dikompres di browser sebelum upload:

- max sisi terpanjang 720px
- WebP quality 0.7 jika didukung browser
- fallback JPEG quality 0.72

TTD canvas tetap dikirim sebagai PNG agar garis tanda tangan tetap tajam. Database hanya menyimpan URL Cloudinary, `public_id`, dan metadata event, bukan binary gambar.

Saat perjanjian dihapus dari admin, server otomatis memanggil Cloudinary destroy API untuk menghapus asset TTD dan wajah berdasarkan `public_id`.

## Deployment Vercel

Deploy sebagai dua project Vercel:

- `client`: root directory `client`
- `server`: root directory `server`

Environment `client`:

```bash
VITE_API_BASE_URL=https://url-server-vercel.vercel.app/api
```

Environment `server`:

```bash
CLIENT_ORIGIN=https://url-client-vercel.vercel.app
APP_PUBLIC_URL=https://url-client-vercel.vercel.app

MYSQL_HOST=...
MYSQL_PORT=3306
MYSQL_USER=...
MYSQL_PASSWORD=...
MYSQL_DATABASE=...

ADMIN_USERNAME=admin
ADMIN_PASSWORD=password-produksi-yang-kuat
COOKIE_SAMESITE=None
COOKIE_SECURE=true

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_UPLOAD_FOLDER=surat-kerjasama
```

Setelah environment server siap, jalankan migrasi database dari lokal dengan `.env` yang mengarah ke database cloud:

```bash
cd server
npm run migrate
```
