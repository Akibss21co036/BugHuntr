import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// POST /api/bug-hunt/update-status
export async function POST(req: NextRequest) {
  try {
    const { bugReportId, newStatus } = await req.json();
    if (!bugReportId || !newStatus) {
      return NextResponse.json({ error: 'Missing bugReportId or newStatus' }, { status: 400 });
    }

    // Get the bug report document
    const bugReportRef = doc(db, 'bugReports', bugReportId);
    const bugReportSnap = await getDoc(bugReportRef);
    if (!bugReportSnap.exists()) {
      return NextResponse.json({ error: 'Bug report not found' }, { status: 404 });
    }
    const bugReport = bugReportSnap.data();
    const userId = bugReport.userId;

    // Update the bug report status
    await updateDoc(bugReportRef, { status: newStatus });

    // Update the user's submission status
    const userSubmissionRef = doc(db, 'users', userId, 'submissions', bugReportId);
    await updateDoc(userSubmissionRef, { status: newStatus });

    // Firestore real-time listeners on the frontend will handle UI updates
    return NextResponse.json({ success: true });
  } catch (error) {
    let errorMsg = 'Internal server error';
    if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMsg = (error as any).message;
    } else if (typeof error === 'string') {
      errorMsg = error;
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
