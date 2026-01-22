import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import bcrypt from 'bcryptjs';
import type { TaxAgent, TaxAgentPublic } from '@/types/tax-agent';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Admin credentials (same as AdminPage)
const ADMIN_CREDENTIALS = {
  username: 'AdminAnil',
  password: 'Admin@123',
};

function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return false;
  }

  const base64Credentials = authHeader.substring(6);
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');

  return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
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

// GET - Get single Tax Agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const agentData = await redis.get<string>(`tax_agent:${id}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Tax Agent not found' },
        { status: 404 }
      );
    }

    const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...agentWithoutPassword } = agent;

    return NextResponse.json({ success: true, agent: agentWithoutPassword });
  } catch (error) {
    console.error('❌ Error getting Tax Agent:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get Tax Agent' },
      { status: 500 }
    );
  }
}

// PUT - Update Tax Agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const agentData = await redis.get<string>(`tax_agent:${id}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Tax Agent not found' },
        { status: 404 }
      );
    }

    const existingAgent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;
    const updates = await request.json();

    // Update fields
    const updatedAgent: TaxAgent = {
      ...existingAgent,
      name: updates.name ?? existingAgent.name,
      role: updates.role ?? existingAgent.role,
      bio: updates.bio !== undefined ? updates.bio : existingAgent.bio,
      certifications: updates.certifications !== undefined ? updates.certifications : existingAgent.certifications,
      experienceYears: updates.experienceYears !== undefined ? updates.experienceYears : existingAgent.experienceYears,
      specializations: updates.specializations !== undefined ? updates.specializations : existingAgent.specializations,
      contactPhone: updates.contactPhone !== undefined ? updates.contactPhone : existingAgent.contactPhone,
      photoBase64: updates.photoBase64 !== undefined ? updates.photoBase64 : existingAgent.photoBase64,
      isActive: updates.isActive !== undefined ? updates.isActive : existingAgent.isActive,
      updatedAt: new Date().toISOString(),
    };

    // Handle password change
    if (updates.password) {
      if (updates.password.length < 8) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 8 characters' },
          { status: 400 }
        );
      }
      updatedAgent.passwordHash = await bcrypt.hash(updates.password, 10);
    }

    // Save updated agent
    await redis.set(`tax_agent:${id}`, JSON.stringify(updatedAgent));

    console.log(`✅ Tax Agent updated: ${updatedAgent.name} (${updatedAgent.email})`);

    return NextResponse.json({
      success: true,
      agent: toPublicAgent(updatedAgent),
    });
  } catch (error) {
    console.error('❌ Error updating Tax Agent:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update Tax Agent' },
      { status: 500 }
    );
  }
}

// DELETE - Deactivate Tax Agent (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const agentData = await redis.get<string>(`tax_agent:${id}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Tax Agent not found' },
        { status: 404 }
      );
    }

    const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;

    // Soft delete - just deactivate
    agent.isActive = false;
    agent.updatedAt = new Date().toISOString();

    await redis.set(`tax_agent:${id}`, JSON.stringify(agent));

    console.log(`✅ Tax Agent deactivated: ${agent.name} (${agent.email})`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error deactivating Tax Agent:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to deactivate Tax Agent' },
      { status: 500 }
    );
  }
}
