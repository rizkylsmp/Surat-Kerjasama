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
