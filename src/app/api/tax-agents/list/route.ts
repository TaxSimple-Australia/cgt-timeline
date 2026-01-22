import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { TaxAgent } from '@/types/tax-agent';

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

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    // Get all agent IDs
    const agentsList = await redis.get<string[]>('tax_agents_list') || [];

    if (agentsList.length === 0) {
      return NextResponse.json({ success: true, agents: [] });
    }

    // Fetch all agents
    const agents: TaxAgent[] = [];
    for (const agentId of agentsList) {
      const agentData = await redis.get<string>(`tax_agent:${agentId}`);
      if (agentData) {
        const agent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;
        // Exclude password hash from response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...agentWithoutPassword } = agent;
        agents.push(agentWithoutPassword);
      }
    }

    // Sort by creation date (newest first)
    agents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    console.log(`📋 Listed ${agents.length} Tax Agents`);

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('❌ Error listing Tax Agents:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list Tax Agents',
      },
      { status: 500 }
    );
  }
}
