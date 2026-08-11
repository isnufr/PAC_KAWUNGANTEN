const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

function parseDate(dateStr) {
    if (!dateStr || dateStr.trim() === '') return null;
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            // YYYY-MM-DD
            if (parts[0].length === 4) {
                return new Date(dateStr);
            }
        }
        return new Date(dateStr);
    } catch (e) {
        return null;
    }
}

async function parseCSV(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`File ${filePath} tidak ditemukan, melewatinya...`);
        return [];
    }
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let headers = [];
    const records = [];
    let isFirstLine = true;

    for await (const line of rl) {
        // Pemisahan kolom sederhana berdasarkan koma, mengabaikan koma di dalam kutipan
        // Ini adalah regex untuk split CSV standar:
        const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        let columns = line.split(','); 
        // fallback jika simple split cukup untuk CSV ini
        if (isFirstLine) {
            headers = columns.map(h => h.trim());
            isFirstLine = false;
        } else {
            const obj = {};
            columns.forEach((val, i) => {
                if (headers[i]) {
                    obj[headers[i].toUpperCase().replace(/\s+/g, '_')] = val.trim().replace(/^['"]/, '').replace(/['"]$/, '');
                }
            });
            records.push(obj);
        }
    }
    return records;
}

async function main() {
    console.log("Mulai melakukan seeding data dari CSV...");
    
    // 1. Wilayah
    console.log("Processing Wilayah...");
    const wilayahData = await parseCSV(path.join(__dirname, 'Wilayah.csv'));
    for (const w of wilayahData) {
        if (!w.KECAMATAN || !w.DESA) continue;
        await prisma.wilayah.upsert({
            where: {
                kecamatan_desa_dusun: {
                    kecamatan: w.KECAMATAN,
                    desa: w.DESA,
                    dusun: w.DUSUN || ''
                }
            },
            update: {},
            create: {
                kecamatan: w.KECAMATAN,
                desa: w.DESA,
                dusun: w.DUSUN || ''
            }
        });
    }

    // Ambil wilayah mapping
    const dbWilayah = await prisma.wilayah.findMany();
    const mapWilayah = {};
    dbWilayah.forEach(w => {
        mapWilayah[`${w.kecamatan}-${w.desa}-${w.dusun}`] = w.id;
    });

    // 2. Users
    console.log("Processing Users...");
    const usersData = await parseCSV(path.join(__dirname, 'Users.csv'));
    for (const u of usersData) {
        if (!u.USERNAME) continue;
        const hashed = await bcrypt.hash(u.PASSWORD || '12345', 10);
        await prisma.user.upsert({
            where: { username: u.USERNAME },
            update: { role: u.ROLE || 'Viewer' },
            create: {
                username: u.USERNAME,
                password: hashed,
                role: u.ROLE || 'Viewer'
            }
        });
    }

    // 3. Data Anggota
    console.log("Processing Data Anggota...");
    const anggotaData = await parseCSV(path.join(__dirname, 'Data_Anggota.csv'));
    for (const a of anggotaData) {
        if (!a.NIK) continue;
        let wilayahId = null;
        if (a.KECAMATAN && a.DESA) {
            wilayahId = mapWilayah[`${a.KECAMATAN}-${a.DESA}-${a.DUSUN || ''}`];
        }
        
        await prisma.anggota.upsert({
            where: { nik: a.NIK },
            update: {
                nama: a.NAMA,
                tanggalLahir: a.TANGGAL_LAHIR,
                jenisKelamin: a.JENIS_KELAMIN,
                umur: parseInt(a.UMUR) || null,
                nomorHp: a.NOMOR_HP || a.NO_HP,
                bagian: a.BAGIAN,
                jabatan: a.JABATAN,
                kecamatan: a.KECAMATAN,
                desa: a.DESA,
                dusun: a.DUSUN,
                wilayahId: wilayahId,
                fotoKtpUrl: a.FOTO_KTP || a.LINK_FOTO_KTP,
                passFotoUrl: a.PASS_FOTO || a.LINK_PASS_FOTO
            },
            create: {
                nik: a.NIK,
                nama: a.NAMA || '',
                tanggalLahir: a.TANGGAL_LAHIR,
                jenisKelamin: a.JENIS_KELAMIN,
                umur: parseInt(a.UMUR) || null,
                nomorHp: a.NOMOR_HP || a.NO_HP,
                bagian: a.BAGIAN,
                jabatan: a.JABATAN,
                kecamatan: a.KECAMATAN,
                desa: a.DESA,
                dusun: a.DUSUN,
                wilayahId: wilayahId,
                fotoKtpUrl: a.FOTO_KTP || a.LINK_FOTO_KTP,
                passFotoUrl: a.PASS_FOTO || a.LINK_PASS_FOTO
            }
        });
    }
    
    // 4. Kas Organisasi
    console.log("Processing Kas Organisasi...");
    const kasData = await parseCSV(path.join(__dirname, 'Kas_Organisasi.csv'));
    for (const k of kasData) {
        if (!k.TANGGAL || !k.TIPE) continue;
        let d = parseDate(k.TANGGAL);
        if (!d) d = new Date();
        
        await prisma.kasOrganisasi.create({
            data: {
                tanggal: d,
                tipe: k.TIPE,
                nominal: parseInt(k.NOMINAL) || 0,
                kategori: k.KATEGORI,
                keterangan: k.KETERANGAN,
                operator: k.OPERATOR
            }
        });
    }

    // 5. Log Aktivitas
    console.log("Processing Log Aktivitas...");
    const logData = await parseCSV(path.join(__dirname, 'Log_Aktivitas.csv'));
    for (const l of logData) {
        if (!l.WAKTU || !l.PENGGUNA) continue;
        let d = new Date(l.WAKTU);
        if (isNaN(d.getTime())) d = new Date();
        
        await prisma.logAktivitas.create({
            data: {
                waktu: d,
                pengguna: l.PENGGUNA,
                aksi: l.AKSI || '',
                detail: l.DETAIL
            }
        });
    }

    console.log("Seeding selesai!");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
