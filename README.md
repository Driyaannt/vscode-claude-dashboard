# Claude Usage

Track penggunaan Claude API Anda langsung dari status bar VS Code.

## Fitur

- **Status Bar Display** - Menampilkan usage limit saat ini (contoh: `Claude: 77/250`)
- **Sidebar Dashboard** - Panel interaktif dengan statistik lengkap (hourly & weekly usage, reset times)
- **Codex Usage** - Menampilkan rate limit Codex dari endpoint `wham/usage` jika token/session API tersedia
- **Auto Refresh** - Data otomatis diperbarui setiap 5 menit
- **Manual Refresh** - Klik pada status bar atau jalankan command `Refresh Claude Usage`
- **Tooltip Info** - Arahkan mouse ke status bar untuk melihat detail lengkap

## Preview

### Claude Usage

![Claude Usage Dashboard](assets/preview.svg)

### Codex Usage

![Codex Usage Dashboard](assets/codex-preview.svg)

Status bar menampilkan: `$(cloud) Claude: {current}/{max}`

Tooltip menampilkan detail lengkap penggunaan API.

Sidebar panel menampilkan dashboard Claude dan Codex dengan statistik lengkap. API key dan email disensor di tampilan agar credential tidak terbaca.

## Requirement

- VS Code versi 1.120.0 atau lebih baru
- Koneksi internet untuk mengambil data dari API

## Configuration

Jalankan command `Set Claude Auth`, lalu paste API key atau identifier Claude usage. Nilai ini disimpan di VS Code SecretStorage dan tidak ditampilkan mentah di dashboard.

## Installation

1. Clone repository ini
2. Jalankan `npm install`
3. Jalankan `npm run compile` untuk compile TypeScript
4. Jalankan `npm run package` untuk membuat bundle production di folder `dist`
5. Jalankan `npm run vsix` untuk membuat file `.vsix`
6. File VSIX akan muncul di root project, misalnya `claude-usage-0.0.1.vsix`
7. Instal ke VS Code:
   - Klik ikon **Extensions** di menu paling kiri VS Code (atau tekan `Ctrl + Shift + X`)
   - Di pojok kanan atas panel Extensions, klik ikon **Titik Tiga (...)**
   - Pilih menu **Install from VSIX...**
   - Cari dan pilih file `claude-usage-0.0.1.vsix` yang baru saja Anda buat

![Install from VSIX](assets/install-vsix.png)

## Development

Tekan `F5` di VS Code untuk membuka jendela Extension Development Host.

## Commands

| Command | Deskripsi |
|---------|-----------|
| `claude-usage.refreshData` | Refresh data penggunaan manual |
| `claude-usage.setClaudeAuth` | Simpan API key atau identifier Claude usage |
| `claude-usage.clearClaudeAuth` | Hapus auth Claude yang tersimpan |
| `claude-usage.setCodexAuth` | Simpan Bearer token atau Cookie ChatGPT untuk Codex usage |
| `claude-usage.clearCodexAuth` | Hapus auth Codex yang tersimpan |

## API Endpoint

Claude usage diambil dari `https://ai.bluepack.my.id/api/check-usage`. Jalankan command `Set Claude Auth`, lalu paste API key atau identifier Claude usage. Auth disimpan di VS Code SecretStorage.

Codex usage diambil dari `https://chatgpt.com/backend-api/wham/usage`. Jika endpoint ini hanya bisa dibuka lewat browser yang sudah login, jalankan command `Set Codex Auth`, lalu paste `Bearer ...` atau `Cookie: ...` dari request browser. Auth disimpan di VS Code SecretStorage. Alternatifnya, ubah `claudeUsage.codexEndpoint` ke endpoint proxy yang sudah authenticated.

## Teknologi

- TypeScript
- VS Code Extension API
- Webpack untuk bundling

## Lisensi

MIT
