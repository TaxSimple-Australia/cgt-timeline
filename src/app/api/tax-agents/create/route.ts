import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import type { TaxAgent, CreateTaxAgentRequest, CreateTaxAgentResponse, TaxAgentPublic } from '@/types/tax-agent';

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

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const body: CreateTaxAgentRequest = await request.json();
    const { email, password, name, role } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, password, name, role' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['tax_agent', 'senior_tax_agent'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be tax_agent or senior_tax_agent' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAgentId = await redis.get(`tax_agent_email:${email.toLowerCase()}`);
    if (existingAgentId) {
      return NextResponse.json(
        { success: false, error: 'A Tax Agent with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate unique ID
    const agentId = nanoid(12);
    const now = new Date().toISOString();

    // Create Tax Agent object
    const taxAgent: TaxAgent = {
      id: agentId,
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      createdAt: now,
      updatedAt: now,
      createdBy: ADMIN_CREDENTIALS.username,
      isActive: true,
    };

    // Store Tax Agent
    await redis.set(`tax_agent:${agentId}`, JSON.stringify(taxAgent));

    // Create email index
    await redis.set(`tax_agent_email:${email.toLowerCase()}`, agentId);

    // Add to agents list
    const agentsList = await redis.get<string[]>('tax_agents_list') || [];
    agentsList.push(agentId);
    await redis.set('tax_agents_list', JSON.stringify(agentsList));

    console.log(`✅ Tax Agent created: ${name} (${email}) - ID: ${agentId}`);

    const response: CreateTaxAgentResponse = {
      success: true,
      agent: toPublicAgent(taxAgent),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error creating Tax Agent:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Tax Agent',
      },
      { status: 500 }
    );
  }
}
