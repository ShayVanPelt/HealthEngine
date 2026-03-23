import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const entry = await prisma.calorieEntry.findFirst({
      where: { id, userId: auth.session.userId },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.calorieEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/calories/:id]', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
