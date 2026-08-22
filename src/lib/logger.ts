import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_kwt_2024';

export async function logAktivitas(req: NextRequest, aksi: string, detail: string, defaultPengguna?: string) {
    try {
        let pengguna = defaultPengguna || 'Sistem';
        
        // Coba ambil username dari token JWT jika tidak ada defaultPengguna
        if (!defaultPengguna) {
            const token = req.cookies.get('auth_token')?.value;
            if (token) {
                try {
                    const decoded = jwt.verify(token, JWT_SECRET) as any;
                    if (decoded && decoded.username) {
                        pengguna = decoded.username;
                    }
                } catch (e) {
                    // Ignore token errors
                }
            }
        }

        await prisma.logAktivitas.create({
            data: {
                pengguna,
                aksi,
                detail
            }
        });
    } catch (error) {
        console.error('Gagal menyimpan log aktivitas:', error);
    }
}
