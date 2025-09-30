import { NextResponse } from 'next/server';
import { db } from '@/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Add the bug hunt to Firestore
    const docRef = await addDoc(collection(db, 'bugHunts'), {
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error creating bug hunt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
