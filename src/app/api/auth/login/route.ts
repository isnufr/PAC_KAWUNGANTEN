export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_kwt_2024';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        anggota: {
          select: {
            nama: true,
            passFotoUrl: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Password salah' }, { status: 401 });
    }

    // Buat JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        anggotaId: user.anggotaId 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set token di HTTP-Only Cookie DAN di response body
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      token: token,
      user: {
        username: user.username,
        role: user.role,
        anggotaId: user.anggotaId,
        userPhoto: user.anggota?.passFotoUrl || null,
        nama: user.anggota?.nama || null
      }
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 hari
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
