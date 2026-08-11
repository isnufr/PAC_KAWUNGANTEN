import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('API Users GET Error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, password, role } = await req.json();
    
    // Cek duplikasi
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        username: true,
        role: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil ditambahkan',
      data: newUser
    }, { status: 201 });

  } catch (error) {
    console.error('API Users POST Error:', error);
    return NextResponse.json({ error: 'Gagal menambahkan pengguna' }, { status: 500 });
  }
}
