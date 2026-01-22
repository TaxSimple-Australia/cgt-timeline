import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import type { TaxAgent, TaxAgentLoginRequest, TaxAgentLoginResponse, TaxAgentPublic, TaxAgentSession } from '@/types/tax-agent';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Session duration: 24 hours
const SESSION_DURATION_SECONDS = 24 * 60 * 60;

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

export async function POST(request: NextRequest) {
  try {
    const body: TaxAgentLoginRequest = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Look up agent by email
    const agentId = await redis.get<string>(`tax_agent_email:${email.toLowerCase()}`);
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get agent data
    const agentData = await redis.get<string>(`tax_agent:${agentId}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;

    // Check if agent is active
    if (!agent.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, agent.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = nanoid(32);
    const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();

    const session: TaxAgentSession = {
      agentId: agent.id,
      expiresAt,
    };

    // Store session with TTL
    await redis.set(`tax_agent_session:${sessionToken}`, JSON.stringify(session), {
      ex: SESSION_DURATION_SECONDS,
    });

    console.log(`✅ Tax Agent logged in: ${agent.name} (${agent.email})`);

    const response: TaxAgentLoginResponse = {
      success: true,
      token: sessionToken,
      agent: toPublicAgent(agent),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error during Tax Agent login:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      },
      { status: 500 }
    );
  }
}
