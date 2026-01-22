import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { TaxAgent, TaxAgentPublic, TaxAgentSession } from '@/types/tax-agent';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

async function verifyTaxAgentSession(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const sessionData = await redis.get<string>(`tax_agent_session:${token}`);
  if (!sessionData) {
    return null;
  }

  const session: TaxAgentSession = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

  if (new Date(session.expiresAt) < new Date()) {
    await redis.del(`tax_agent_session:${token}`);
    return null;
  }

  return session.agentId;
}

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

// GET - Get own profile
export async function GET(request: NextRequest) {
  try {
    const agentId = await verifyTaxAgentSession(request);
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const agentData = await redis.get<string>(`tax_agent:${agentId}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;

    return NextResponse.json({
      success: true,
      agent: toPublicAgent(agent),
    });
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get profile' },
      { status: 500 }
    );
  }
}

// PUT - Update own profile
export async function PUT(request: NextRequest) {
  try {
    const agentId = await verifyTaxAgentSession(request);
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const agentData = await redis.get<string>(`tax_agent:${agentId}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;
    const updates = await request.json();

    // Only allow updating profile fields (not email, password, role, etc.)
    const allowedFields = ['bio', 'certifications', 'experienceYears', 'specializations', 'contactPhone', 'photoBase64'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        // Validate photo size (max 500KB)
        if (field === 'photoBase64' && updates[field]) {
          const base64Size = updates[field].length * 0.75; // Approximate size in bytes
          if (base64Size > 500 * 1024) {
            return NextResponse.json(
              { success: false, error: 'Photo is too large. Maximum size is 500KB.' },
              { status: 400 }
            );
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (agent as any)[field] = updates[field];
      }
    }

    agent.updatedAt = new Date().toISOString();

    // Save updated agent
    await redis.set(`tax_agent:${agentId}`, JSON.stringify(agent));

    console.log(`✅ Tax Agent profile updated: ${agent.name}`);

    return NextResponse.json({
      success: true,
      agent: toPublicAgent(agent),
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}
