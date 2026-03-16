import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const entry = await prisma.weightEntry.findFirst({
      where: { id, userId: session.userId },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.weightEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/weight/:id]', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
