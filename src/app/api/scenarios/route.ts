import { NextRequest, NextResponse } from 'next/server';
import { getAllScenarios, createScenario } from '@/lib/scenario-storage';

export async function GET() {
  try {
    const scenarios = await getAllScenarios();
    return NextResponse.json({ success: true, scenarios });
  } catch (error) {
    console.error('❌ Error fetching scenarios:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metadata, scenarioData } = body;

    if (!metadata?.title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const scenario = await createScenario(metadata, scenarioData);
    return NextResponse.json({ success: true, scenario });
  } catch (error) {
    console.error('❌ Error creating scenario:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create scenario' },
      { status: 500 }
    );
  }
}
