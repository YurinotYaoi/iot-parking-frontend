// app/api/test/route.js
import { db } from '@/lib/configs/firebase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ref = db.ref('/');
    const snapshot = await ref.limitToFirst(1).once('value');
    return NextResponse.json({ status: 'Firebase connected', data: snapshot.val() });
  } catch (err) {
    return NextResponse.json({ status: 'Firebase error', error: err.message }, { status: 500 });
  }
}
