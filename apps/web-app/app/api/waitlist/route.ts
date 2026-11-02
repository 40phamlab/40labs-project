import { NextRequest, NextResponse } from 'next/server';
import { waitlistStore } from '@/lib/waitlist/store';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 5;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    const limitEntry = rateLimitMap.get(ip);
    if (limitEntry) {
      if (now < limitEntry.resetTime) {
        if (limitEntry.count >= MAX_REQUESTS) {
          return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
        }
        limitEntry.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    const body = await req.json();
    const { name, email, role, institution, hp } = body;

    // Honeypot check
    if (hp) {
      return NextResponse.json({ success: true, message: "You're on the list." });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Valid name is required.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (!role || !['Doctor', 'Researcher', 'Student', 'Pharmacist', 'Other'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required.' }, { status: 400 });
    }

    const existing = await waitlistStore.findByEmail(email.trim());
    if (existing) {
      return NextResponse.json({ success: true, message: "You're on the list." });
    }

    await waitlistStore.add({
      name: name.trim(),
      email: email.trim(),
      role,
      institution: institution ? institution.trim() : undefined,
      ip,
    });

    return NextResponse.json({ success: true, message: "You're on the list." }, { status: 201 });
  } catch (error: any) {
    console.error('Waitlist API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
