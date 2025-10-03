import { NextResponse } from 'next/server';
import { db } from '@/firebaseConfig';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { username, action, bugId, points } = await request.json();
    
    if (!username || !action || !bugId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find user profile
    const userQuery = query(collection(db, "userProfiles"), where("username", "==", username));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const currentPoints = userData.points || 0;

    let pointChange = 0;
    
    if (action === 'accept') {
      // Award bonus points for accepted submissions
      pointChange = points || 0;
    } else if (action === 'reject') {
      // Optionally deduct points for rejected submissions
      pointChange = 0; // Or negative points if desired
    }

    // Update user points
    if (pointChange !== 0) {
      await updateDoc(doc(db, "userProfiles", userDoc.id), {
        points: Math.max(0, currentPoints + pointChange),
        lastActivity: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Update bug submission status
    const bugRef = doc(db, "bugs", bugId);
    await updateDoc(bugRef, {
      status: action === 'accept' ? 'accepted' : 'rejected',
      reviewedAt: new Date().toISOString(),
      adminNotes: `Submission ${action}ed`,
    });

    return NextResponse.json({ 
      success: true, 
      pointsAwarded: pointChange,
      newTotal: currentPoints + pointChange 
    });
  } catch (error) {
    console.error('Error updating bug status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}