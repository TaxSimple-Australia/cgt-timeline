import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { TaxAgent, TaxAgentPublic } from '@/types/tax-agent';

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

export async function GET() {
  try {
    // Get all agent IDs
    const agentsList = await redis.get<string[]>('tax_agents_list') || [];

    if (agentsList.length === 0) {
      return NextResponse.json({ success: true, agents: [] });
    }

    // Fetch all active agents
    const agents: TaxAgentPublic[] = [];
    for (const agentId of agentsList) {
      const agentData = await redis.get<string>(`tax_agent:${agentId}`);
      if (agentData) {
        const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;
        // Only include active agents
        if (agent.isActive) {
          agents.push(toPublicAgent(agent));
        }
      }
    }

    // Sort by experience (senior first), then by name
    agents.sort((a, b) => {
      // Senior agents first
      if (a.role === 'senior_tax_agent' && b.role !== 'senior_tax_agent') return -1;
      if (a.role !== 'senior_tax_agent' && b.role === 'senior_tax_agent') return 1;
      // Then by experience
      const expA = a.experienceYears || 0;
      const expB = b.experienceYears || 0;
      if (expA !== expB) return expB - expA;
      // Then by name
      return a.name.localeCompare(b.name);
    });

    console.log(`📋 Public list: ${agents.length} active Tax Agents`);

    return NextResponse.json({ success: true, agents });
  } catch (error) {
    console.error('❌ Error listing public Tax Agents:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list Tax Agents',
      },
      { status: 500 }
    );
  }
}
