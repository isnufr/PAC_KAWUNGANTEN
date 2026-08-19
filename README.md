# PAC PDIP Kawunganten

Aplikasi web untuk manajemen anggota dan agenda PAC PDIP Kawunganten.

## Infrastruktur & Deployment

Informasi mengenai deployment dan repository project ini:
- **Repository**: [GitHub](https://github.com)
- **Hosting / Deployment**: [Coolify](https://coolify.io)

### Catatan Deployment
Jika ada perubahan pada struktur database (misalnya ada penambahan tabel pada `schema.prisma`), pastikan setelah push ke GitHub dan Coolify selesai melakukan build, Anda perlu menjalankan command update database pada server (container) Coolify Anda:

```bash
npx prisma generate
npx prisma db push
```

Atau jika menggunakan sistem migrasi:
```bash
npx prisma migrate deploy
```
