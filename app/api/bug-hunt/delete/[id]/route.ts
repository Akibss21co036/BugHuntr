
import { NextResponse } from 'next/server';
import { db } from '@/firebaseConfig';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const bugHuntId = params.id;

    // Get the bug hunt document
    const bugHuntRef = doc(db, 'bugHunts', bugHuntId);
    const bugHuntSnap = await getDoc(bugHuntRef);
    
    if (!bugHuntSnap.exists()) {
      return NextResponse.json({ error: 'Bug hunt not found' }, { status: 404 });
    }

    // Delete the bug hunt
    await deleteDoc(bugHuntRef);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bug hunt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
