import { NextRequest, NextResponse } from 'next/server';
import { getScenario, updateScenarioMetadata, updateScenarioFullData, deleteScenario } from '@/lib/scenario-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scenario = await getScenario(id);

    if (!scenario) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, scenario });
  } catch (error) {
    console.error('❌ Error fetching scenario:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { metadata, scenarioData } = body;

    let updated = null;

    if (scenarioData !== undefined) {
      // Update full scenario data (timeline data)
      updated = await updateScenarioFullData(id, scenarioData);
    }

    if (metadata) {
      // Update metadata (can be combined with scenarioData update)
      updated = await updateScenarioMetadata(id, metadata);
    }

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found or no updates provided' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, scenario: updated });
  } catch (error) {
    console.error('❌ Error updating scenario:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteScenario(id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting scenario:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}
