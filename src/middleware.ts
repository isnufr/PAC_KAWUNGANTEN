import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Secret key harus sama persis dengan yang ada di /api/auth/login
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_kwt_2024';

export async function middleware(request: NextRequest) {
  const publicPaths = [
    '/login',
    '/api/auth/login',
    '/_next',
    '/uploads',
    '/api/uploads',
    '/favicon.ico',
    '/manifest.json'
  ];

  // Jika pathname berawalan dengan salah satu publicPaths, izinkan langsung
  if (publicPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Ambil token dari cookies
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    // Jika Request ke API -> Balas JSON 401 Unauthorized
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Token tidak tersedia' }, { status: 401 });
    }
    // Jika Request ke Halaman Web -> Redirect ke Login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verifikasi Token menggunakan library `jose` (mendukung Edge Runtime)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // (Opsional) Mengirimkan data role ke headers agar API Route bisa membacanya
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-role', payload.role as string);
    requestHeaders.set('x-user-username', payload.username as string);
    requestHeaders.set('x-user-id', String(payload.id));

    // Proteksi Ekstra: Hanya Super Admin yang boleh mengatur user (POST, PUT, DELETE) di /api/users
    if (request.nextUrl.pathname.startsWith('/api/users') && request.method !== 'GET') {
      if (payload.role !== 'Super Admin') {
        return NextResponse.json({ success: false, error: 'Forbidden: Akses ditolak, khusus Super Admin' }, { status: 403 });
      }
    }

    // Proteksi Ekstra: Viewer tidak boleh melakukan aksi ubah data (POST, PUT, DELETE)
    const protectedDataRoutes = ['/api/anggota', '/api/kas', '/api/upload'];
    if (protectedDataRoutes.some(route => request.nextUrl.pathname.startsWith(route)) && request.method !== 'GET') {
      if (payload.role === 'Viewer') {
        return NextResponse.json({ success: false, error: 'Forbidden: Viewer hanya dapat melihat data' }, { status: 403 });
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Middleware JWT Error:', error);
    // Token kadaluarsa atau tidak valid
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Sesi kadaluarsa atau token tidak valid' }, { status: 401 });
    }
    // Hapus cookie tidak valid dan redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Mencegat semua request KECUALI yang berhubungan dengan Next.js internal statics
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
