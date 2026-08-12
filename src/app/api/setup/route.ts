import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('123123', 10);
    
    const existingUser = await prisma.user.findUnique({
      where: { username: 'isnu08' }
    });

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { username: 'isnu08' },
        data: {
          password: hashedPassword,
          role: 'Super Admin'
        }
      });
      return NextResponse.json({ success: true, message: 'Berhasil memperbarui user: ' + updatedUser.username });
    } else {
      const newUser = await prisma.user.create({
        data: {
          username: 'isnu08',
          password: hashedPassword,
          role: 'Super Admin'
        }
      });
      return NextResponse.json({ success: true, message: 'Berhasil membuat user baru: ' + newUser.username });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan pada database' }, { status: 500 });
  }
}
