
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Authenticate admin
  const session = await getServerSession();
  // Adjust user type to allow id and isAdmin
  const user = session?.user as { id?: string; isAdmin?: boolean };
  if (!user?.isAdmin || !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminId = user.id;
  const bugHuntId = params.id;

  const { db } = await connectToDatabase();
  const bugHunt = await db.collection('bughunts').findOne({ _id: new ObjectId(bugHuntId) });

  if (!bugHunt) {
    return NextResponse.json({ error: 'BugHunt not found' }, { status: 404 });
  }

  if (bugHunt.createdBy !== adminId) {
    return NextResponse.json({ error: 'Forbidden: Only creator can delete' }, { status: 403 });
  }

  await db.collection('bughunts').deleteOne({ _id: new ObjectId(bugHuntId) });
  return NextResponse.json({ success: true });
}
