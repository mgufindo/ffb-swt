# FFB Fleet Management

Aplikasi Vite + React + TypeScript untuk merencanakan dan mengelola operasional armada Fresh Fruit Bunch (FFB).

Fokus proyek:

- Pemisahan jelas antara UI, hooks, dan data access (services/api ↔ database/crud)
- Mudah di-test dengan mocking API adapters
- Build dan deployment sederhana (static SPA atau container)

Dokumen terkait:

- ARCHITECTURE.md — desain sistem dan trade-off
- API.md — dokumentasi data layer (API adapters dan CRUD)
- TESTING.md — strategi testing, pola, dan coverage

## Fitur

- Trip Planning
  - Pilih kendaraan, mills, client, jadwal, durasi, dan status
  - Validasi field wajib
- Reusable DataTable
  - Render baris, empty state, row actions, onRowClick
  - Guard performa: render 10.000 baris dalam batas waktu
- Authentication hook (useAuth) untuk proteksi UI
- Data layer lokal, UI hanya bergantung ke `services/api/*`

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS
- Vitest + Testing Library + user-event (unit/integration)
- Data layer lokal di `src/services/database/*` dengan adapters UI di `src/services/api/*`
- Docker multi-stage + docker-compose (dev/prod/test)

## Prasyarat

- Node.js 22
- npm
- Docker & Docker Compose (opsional, untuk workflow ter-container)

## Memulai (Local)

Install dependency:

```bash
npm install
```

Jalankan dev server (Vite):

```bash
npm run dev
# buka http://localhost:3000
```

Build produksi:

```bash
npm run build
```

Preview hasil build produksi:

```bash
npm run preview
# buka http://localhost:3000
```

Catatan:

- Proyek ini mengkonfigurasi Vite untuk berjalan di port 3000. Jika Anda melihat port lain, cek perintah di package.json atau command yang dipakai container.

## Environment Variables

Gunakan konvensi Vite (prefix `VITE_`) agar variabel tersedia di client.

Contoh `.env.local`:

```dotenv
VITE_APP_NAME="FFB Fleet Management"
# Jika nanti menambah remote API:
# VITE_API_BASE_URL="https://api.example.com"
```

## Struktur Proyek

```
src/
  components/
    atoms/        # komponen presentasional kecil (Badge, dsb)
    molecules/    # komponen komposit (DataTable, TripForm)
    pages/        # komponen level route (Login, dsb)
  hooks/
    useAuth.ts    # state & aksi auth untuk UI
  services/
    api/          # UI-facing adapters (fetchVehicles, fetchMills, getAllClient, login, ...)
    database/     # implementasi CRUD lokal (internal)
  styles/
  types/
```

Konvensi:

- UI hanya mengimpor dari `services/api/*`. Adapter ini memanggil CRUD di `services/database/*` dan mengembalikan bentuk data yang konsisten untuk UI (mis. `{ data, total }`).

## Skrip NPM

- `dev` — jalankan Vite dev server
- `build` — build bundle produksi
- `preview` — preview hasil build
- `test` — jalankan test mode watch

## Testing

Jalankan test:

```bash
npm test
```

Cakupan MVP:

- Badge: smoke test
- DataTable: render baris, empty state, row click, row actions
- DataTable performa: render 10k baris dalam anggaran waktu
- Login: skenario dasar
- TripForm: data vehicles/mills/clients tampil dan bisa dipilih; happy-path submit; validasi required; cancel; default status

Mocking:

- Test komponen mem-mock `services/api/*` (tidak menyentuh DB)
- Opsi: global mock untuk `services/database/crud/*` di `vitest.setup.ts`
- Pastikan path di `vi.mock()` persis sama dengan import pada komponen

Detail lengkap di TESTING.md.

## Docker

Tersedia Dockerfile multi-stage untuk dev, test, dan prod.

Build & run image produksi (Nginx menyajikan SPA):

```bash
docker build -t ffb-fleet:prod --target prod .
docker run -p 8080:80 ffb-fleet:prod
# http://localhost:8080
```

Jalankan dev di Docker (Vite di 0.0.0.0:3000):

```bash
docker build -t ffb-fleet:dev --target dev .
docker run -p 3000:3000 ffb-fleet:dev
# http://localhost:3000
```

Jalankan test saat build (gate CI):

```bash
docker build -t ffb-fleet:test --target test .
```

Direkomendasikan `.dockerignore`:

```gitignore
node_modules
dist
coverage
.git
.vscode
.idea
npm-debug.log*
yarn.lock
pnpm-lock.yaml
.DS_Store
```

## Docker Compose

Dev (default, hot reload via bind mount):

```bash
docker-compose up
# http://localhost:3000
```

Contoh service dev (dirangkum dari docker-compose.yml):

```yaml
services:
  app:
    build:
      context: .
      target: dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - CHOKIDAR_USEPOLLING=true
      - WATCHPACK_POLLING=true
    volumes:
      - .:/app
      - /app/node_modules
    working_dir: /app
    stdin_open: true
    tty: true
    command: ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
```

Tips:

- `CHOKIDAR_USEPOLLING` dan `WATCHPACK_POLLING` membantu file watching di Docker (WSL2/VM).
- Mount `.:/app` memungkinkan HMR; volume `/app/node_modules` memastikan deps dari image tidak tertimpa bind mount.

## Deployment

Static hosting:

- Host direktori `dist/` di Vercel, Netlify, GitHub Pages, Cloudflare Pages, dlsb.

Containerized:

- Gunakan image produksi (stage `prod`) dari Dockerfile (Nginx menyajikan SPA dan fallback routing SPA aktif melalui `nginx.conf`).

CI (contoh GitHub Actions):

- Install deps, build, jalankan test dengan coverage, upload artifact
- Contoh workflow tersedia di TESTING.md

## Troubleshooting

- Test menyentuh DB:
  - Mock `services/api/*` di suite, atau tambahkan global mocks untuk CRUD di `vitest.setup.ts`.
- Select option assertion gagal:
  - Gunakan `within(select).getByRole("option", { name: /label/i })` dan `userEvent.selectOptions`.
- JSDOM/timeout:
  - Gunakan query `findBy*` untuk UI async dan sesuaikan timeout test bila perlu.
- Alias path error:
  - Konfigurasi alias `@` konsisten di Vite dan Vitest.
- Port tidak sesuai:
  - Pastikan command menjalankan Vite dengan `--host 0.0.0.0 --port 3000`, terutama di Docker/Compose.

## Kontribusi

- Jaga pemisahan UI dan data access (UI → services/api → database/crud)
- Sertakan/pertahankan test untuk fitur baru dan bug fix
- Gunakan query berbasis aksesibilitas di test (getByRole/findByRole)
- Buat komponen kecil dan komposabel (atoms/molecules/pages)

## Lisensi

Tambahkan lisensi pilihan Anda (mis. MIT).
