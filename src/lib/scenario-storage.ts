/**
 * Scenario Storage Library
 *
 * Handles persistent storage of saved CGT scenarios
 * using Vercel KV (Upstash Redis).
 */

import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import type { SavedScenario, SavedScenarioMetadata } from './saved-scenarios';

// Storage constants
const STORAGE = {
  SCENARIO_KEY: 'saved_scenario:',
  INDEX: 'saved_scenarios_index',
} as const;

// Initialize Redis client
function getRedis(): Redis {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

/**
 * Create a new saved scenario
 */
export async function createScenario(
  metadata: SavedScenarioMetadata,
  scenarioData: any
): Promise<SavedScenario> {
  const redis = getRedis();
  const now = new Date().toISOString();
  const id = `scenario_${nanoid(12)}`;

  const scenario: SavedScenario = {
    ...metadata,
    id,
    scenarioData,
    createdAt: now,
    updatedAt: now,
  };

  // Store scenario (no TTL — permanent)
  await redis.set(
    `${STORAGE.SCENARIO_KEY}${id}`,
    JSON.stringify(scenario)
  );

  // Prepend to index (newest first)
  const index = await redis.get<string[]>(STORAGE.INDEX) || [];
  index.unshift(id);
  await redis.set(STORAGE.INDEX, JSON.stringify(index));

  console.log(`✅ Scenario created: ${scenario.title} (${id})`);

  return scenario;
}

/**
 * Get a single scenario by ID
 */
export async function getScenario(id: string): Promise<SavedScenario | null> {
  const redis = getRedis();
  const data = await redis.get<string>(`${STORAGE.SCENARIO_KEY}${id}`);

  if (!data) return null;

  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

/**
 * Get all scenarios, sorted by updatedAt descending
 */
export async function getAllScenarios(): Promise<SavedScenario[]> {
  const redis = getRedis();
  const index = await redis.get<string[]>(STORAGE.INDEX) || [];

  if (index.length === 0) return [];

  const scenarios: SavedScenario[] = [];

  for (const id of index) {
    const scenario = await getScenario(id);
    if (scenario) {
      scenarios.push(scenario);
    }
  }

  // Sort by updatedAt descending
  scenarios.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return scenarios;
}

/**
 * Update scenario metadata (title, description, category, etc.)
 */
export async function updateScenarioMetadata(
  id: string,
  updates: Partial<SavedScenarioMetadata>
): Promise<SavedScenario | null> {
  const redis = getRedis();
  const scenario = await getScenario(id);

  if (!scenario) return null;

  const updatedScenario: SavedScenario = {
    ...scenario,
    ...updates,
    id, // Prevent ID from being changed
    scenarioData: scenario.scenarioData, // Preserve scenario data
    createdAt: scenario.createdAt, // Preserve creation date
    updatedAt: new Date().toISOString(),
  };

  await redis.set(
    `${STORAGE.SCENARIO_KEY}${id}`,
    JSON.stringify(updatedScenario)
  );

  console.log(`✅ Scenario metadata updated: ${updatedScenario.title} (${id})`);

  return updatedScenario;
}

/**
 * Update the full scenario data (timeline data)
 */
export async function updateScenarioFullData(
  id: string,
  scenarioData: any
): Promise<SavedScenario | null> {
  const redis = getRedis();
  const scenario = await getScenario(id);

  if (!scenario) return null;

  const updatedScenario: SavedScenario = {
    ...scenario,
    scenarioData,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(
    `${STORAGE.SCENARIO_KEY}${id}`,
    JSON.stringify(updatedScenario)
  );

  console.log(`✅ Scenario data updated: ${updatedScenario.title} (${id})`);

  return updatedScenario;
}

/**
 * Delete a scenario
 */
export async function deleteScenario(id: string): Promise<boolean> {
  const redis = getRedis();
  const scenario = await getScenario(id);

  if (!scenario) return false;

  // Delete the scenario
  await redis.del(`${STORAGE.SCENARIO_KEY}${id}`);

  // Remove from index
  const index = await redis.get<string[]>(STORAGE.INDEX) || [];
  const newIndex = index.filter(sid => sid !== id);
  await redis.set(STORAGE.INDEX, JSON.stringify(newIndex));

  console.log(`🗑️ Scenario deleted: ${id}`);

  return true;
}
