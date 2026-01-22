import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { TaxAgent, TaxAgentSession, TaxAgentPublic } from '@/types/tax-agent';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

function toPublicAgent(agent: TaxAgent): TaxAgentPublic {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    photoBase64: agent.photoBase64,
    bio: agent.bio,
    certifications: agent.certifications,
    experienceYears: agent.experienceYears,
    specializations: agent.specializations,
    contactPhone: agent.contactPhone,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No session token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Get session
    const sessionData = await redis.get<string>(`tax_agent_session:${token}`);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    const session: TaxAgentSession = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await redis.del(`tax_agent_session:${token}`);
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get agent data
    const agentData = await redis.get<string>(`tax_agent:${session.agentId}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;

    // Check if agent is still active
    if (!agent.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      agent: toPublicAgent(agent),
    });
  } catch (error) {
    console.error('❌ Error verifying Tax Agent session:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Session verification failed',
      },
      { status: 500 }
    );
  }
}
