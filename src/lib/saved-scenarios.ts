import { format } from 'date-fns';

// ===== Types =====

export interface SavedScenarioExpectedResult {
  exemption_type?: string;
  exemption_percentage?: number;
  capital_gain?: number;
  taxable_gain?: number;
  cgt_payable?: number;
  net_capital_gain?: number;
  notes?: string;
}

export interface SavedScenarioMetadata {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  expectedResult?: SavedScenarioExpectedResult;
  applicableRules?: string[];
  userQuery?: string;
}

export interface SavedScenario extends SavedScenarioMetadata {
  id: string;
  scenarioData: any;
  createdAt: string;
  updatedAt: string;
}

// ===== Constants =====

const LOCAL_STORAGE_KEY = 'cgt-brain-saved-scenarios';

// ===== CRUD Operations (async, server-backed) =====

export async function getAllSavedScenarios(): Promise<SavedScenario[]> {
  try {
    const res = await fetch('/api/scenarios');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to fetch');
    return data.scenarios;
  } catch (err) {
    console.error('❌ Failed to fetch saved scenarios:', err);
    return [];
  }
}

export async function getSavedScenario(id: string): Promise<SavedScenario | null> {
  try {
    const res = await fetch(`/api/scenarios/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    return data.scenario;
  } catch (err) {
    console.error('❌ Failed to fetch scenario:', err);
    return null;
  }
}

export async function saveScenario(metadata: SavedScenarioMetadata, scenarioData: any): Promise<SavedScenario | null> {
  try {
    const res = await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata, scenarioData }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to save');
    console.log(`✅ Saved scenario: ${data.scenario.title} (${data.scenario.id})`);
    return data.scenario;
  } catch (err) {
    console.error('❌ Failed to save scenario:', err);
    return null;
  }
}

export async function updateScenario(id: string, updates: Partial<SavedScenarioMetadata>): Promise<SavedScenario | null> {
  try {
    const res = await fetch(`/api/scenarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metadata: updates }),
    });
    const data = await res.json();
    if (!data.success) return null;
    console.log(`✅ Updated scenario metadata: ${data.scenario.title}`);
    return data.scenario;
  } catch (err) {
    console.error('❌ Failed to update scenario:', err);
    return null;
  }
}

export async function updateScenarioData(id: string, scenarioData: any): Promise<SavedScenario | null> {
  try {
    const res = await fetch(`/api/scenarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioData }),
    });
    const data = await res.json();
    if (!data.success) return null;
    console.log(`✅ Updated scenario data: ${data.scenario.title}`);
    return data.scenario;
  } catch (err) {
    console.error('❌ Failed to update scenario data:', err);
    return null;
  }
}

export async function deleteSavedScenario(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!data.success) return false;
    console.log(`🗑️ Deleted scenario: ${id}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to delete scenario:', err);
    return false;
  }
}

// ===== Category Helpers (derived from fetched data) =====

export function getUsedCategories(scenarios: SavedScenario[]): string[] {
  const categories = new Set(scenarios.map(s => s.category).filter(Boolean));
  return Array.from(categories).sort();
}

export function getUsedSubcategories(scenarios: SavedScenario[], category?: string): string[] {
  const filtered = category ? scenarios.filter(s => s.category === category) : scenarios;
  const subcategories = new Set(filtered.map(s => s.subcategory).filter((s): s is string => !!s));
  return Array.from(subcategories).sort();
}

// ===== Migration =====

/**
 * Migrate scenarios from localStorage to server.
 * Returns the number of successfully migrated scenarios.
 */
export async function migrateLocalScenarios(): Promise<number> {
  if (typeof window === 'undefined') return 0;

  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return 0;

  let localScenarios: SavedScenario[];
  try {
    localScenarios = JSON.parse(raw);
  } catch {
    return 0;
  }

  if (!Array.isArray(localScenarios) || localScenarios.length === 0) return 0;

  let migrated = 0;
  for (const scenario of localScenarios) {
    const metadata: SavedScenarioMetadata = {
      title: scenario.title,
      description: scenario.description,
      category: scenario.category,
      subcategory: scenario.subcategory,
      tags: scenario.tags,
      expectedResult: scenario.expectedResult,
      applicableRules: scenario.applicableRules,
      userQuery: scenario.userQuery,
    };

    const saved = await saveScenario(metadata, scenario.scenarioData);
    if (saved) migrated++;
  }

  if (migrated > 0) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log(`✅ Migrated ${migrated}/${localScenarios.length} scenarios to server`);
  }

  return migrated;
}

// ===== Build Scenario Data =====
// Extracted from TimelineControls handleExport (lines 123-316)
// Converts current timeline state to the property_history JSON format

// Use loose types to accept the store's Property/Event types without tight coupling
interface BuildScenarioProperty {
  id: string;
  name: string;
  address?: string;
  color?: string;
  isRental?: boolean;
  owners?: any;
  currentValue?: number;
  currentStatus?: string;
  branch?: number;
  parentPropertyId?: string;
  subdivisionDate?: Date;
  subdivisionGroup?: string;
  lotNumber?: string | number;
  lotSize?: string | number;
  allocationPercentage?: number;
  initialCostBase?: number;
  isMainLotContinuation?: boolean;
  [key: string]: any;
}

interface BuildScenarioEvent {
  id: string;
  propertyId: string;
  date: Date;
  type: string;
  [key: string]: any;
}

const costBaseToApiFieldMap: Record<string, string> = {
  'purchase_price': 'price',
  'sale_price': 'price',
  'land_price': 'land_price',
  'building_price': 'building_price',
  'stamp_duty': 'stamp_duty',
  'purchase_legal_fees': 'purchase_legal_fees',
  'conveyancing_fees': 'conveyancing_fees',
  'conveyancing_fees_purchase': 'conveyancing_fees',
  'conveyancing_fees_sale': 'conveyancing_fees',
  'valuation_fees': 'valuation_fees',
  'building_inspection': 'building_inspection',
  'pest_inspection': 'pest_inspection',
  'purchase_agent_fees': 'purchase_agent_fees',
  'title_legal_fees': 'title_legal_fees',
  'loan_establishment': 'loan_establishment',
  'loan_application_fees': 'loan_application_fees',
  'mortgage_insurance': 'mortgage_insurance',
  'mortgage_discharge_fees': 'mortgage_discharge_fees',
  'survey_fees': 'survey_fees',
  'search_fees': 'search_fees',
  'accountant_fees_purchase': 'accountant_fees_purchase',
  'tax_agent_fees_sale': 'tax_agent_fees_sale',
  'sale_agent_fees': 'agent_fees',
  'sale_legal_fees': 'legal_fees',
  'advertising_costs': 'advertising_costs',
  'staging_costs': 'staging_costs',
  'auction_costs': 'auction_costs',
  'auction_fees': 'auction_fees',
  'land_tax': 'land_tax',
  'council_rates': 'council_rates',
  'water_rates': 'water_rates',
  'insurance': 'insurance',
  'body_corporate_fees': 'body_corporate_fees',
  'interest_on_borrowings': 'interest_on_borrowings',
  'maintenance_costs': 'maintenance_costs',
  'emergency_services_levy': 'emergency_services_levy',
  'boundary_dispute': 'boundary_dispute',
  'title_insurance': 'title_insurance',
  'easement_costs': 'easement_costs',
  'caveat_costs': 'caveat_costs',
  'partition_action': 'partition_action',
  'adverse_possession_defense': 'adverse_possession_defense',
  'renovation_whole_house': 'improvement_cost',
  'renovation_kitchen': 'improvement_cost',
  'renovation_bathroom': 'improvement_cost',
  'extension': 'improvement_cost',
  'swimming_pool': 'improvement_cost',
  'landscaping': 'improvement_cost',
  'landscaping_major': 'improvement_cost',
  'garage_carport': 'improvement_cost',
  'garage': 'improvement_cost',
  'fencing': 'improvement_cost',
  'deck_patio': 'improvement_cost',
  'hvac_system': 'improvement_cost',
  'solar_panels': 'improvement_cost',
  'structural_changes': 'improvement_cost',
  'disability_modifications': 'improvement_cost',
  'water_tank': 'improvement_cost',
  'shed_outbuilding': 'improvement_cost',
  'shed': 'improvement_cost',
};

export function buildScenarioData(properties: BuildScenarioProperty[], events: BuildScenarioEvent[]) {
  return {
    properties: properties.map(property => {
      const propertyEvents = events
        .filter(e => e.propertyId === property.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const property_history = propertyEvents.map(event => {
        const historyItem: any = {
          date: format(event.date, 'yyyy-MM-dd'),
          event: event.type,
        };

        if (event.costBases && event.costBases.length > 0) {
          event.costBases.forEach((cb: any) => {
            const apiField = costBaseToApiFieldMap[cb.definitionId];
            if (apiField) {
              historyItem[apiField] = cb.amount;
            }
          });

          if (event.type === 'improvement' && !historyItem.price) {
            const totalCost = event.costBases.reduce((sum: number, cb: any) => sum + cb.amount, 0);
            if (totalCost > 0) {
              historyItem.price = totalCost;
            }
          }
        } else {
          if (event.amount) {
            historyItem.price = event.amount;
          }
        }

        if (event.landPrice !== undefined) historyItem.land_price = event.landPrice;
        if (event.buildingPrice !== undefined) historyItem.building_price = event.buildingPrice;
        if (event.title) historyItem.title = event.title;
        if (event.description) historyItem.description = event.description;
        if (event.isPPR) historyItem.is_ppr = event.isPPR;
        if (event.contractDate) historyItem.contract_date = format(event.contractDate, 'yyyy-MM-dd');
        if (event.settlementDate) historyItem.settlement_date = format(event.settlementDate, 'yyyy-MM-dd');
        if (event.newStatus) historyItem.new_status = event.newStatus;
        if (event.marketValuation !== undefined) historyItem.market_value = event.marketValuation;

        if (event.checkboxState) historyItem.checkboxState = event.checkboxState;
        if (event.livingUsePercentage !== undefined) historyItem.livingUsePercentage = event.livingUsePercentage;
        if (event.rentalUsePercentage !== undefined) historyItem.rentalUsePercentage = event.rentalUsePercentage;
        if (event.businessUsePercentage !== undefined) historyItem.businessUsePercentage = event.businessUsePercentage;
        if (event.mixedUseMoveInDate) historyItem.mixedUseMoveInDate = format(event.mixedUseMoveInDate, 'yyyy-MM-dd');
        if (event.rentalUseStartDate) historyItem.rentalUseStartDate = format(event.rentalUseStartDate, 'yyyy-MM-dd');
        if (event.businessUseStartDate) historyItem.businessUseStartDate = format(event.businessUseStartDate, 'yyyy-MM-dd');
        if (event.floorAreaData) historyItem.floorAreaData = event.floorAreaData;

        if (event.overTwoHectares) historyItem.overTwoHectares = event.overTwoHectares;
        if (event.isLandOnly) historyItem.isLandOnly = event.isLandOnly;
        if (event.hectares !== undefined) historyItem.hectares = event.hectares;
        if (event.capitalProceedsType) historyItem.capitalProceedsType = event.capitalProceedsType;
        if (event.exemptionType) historyItem.exemptionType = event.exemptionType;
        if (event.isResident !== undefined) historyItem.isResident = event.isResident;
        if (event.previousYearLosses) historyItem.previousYearLosses = event.previousYearLosses;
        if (event.affectsStatus) historyItem.affectsStatus = event.affectsStatus;

        if (event.leavingOwners) historyItem.leavingOwners = event.leavingOwners;
        if (event.newOwners) historyItem.newOwners = event.newOwners;
        if (event.ownershipChangeReason) historyItem.ownershipChangeReason = event.ownershipChangeReason;
        if (event.ownershipChangeReasonOther) historyItem.ownershipChangeReasonOther = event.ownershipChangeReasonOther;
        if (event.previousOwners) historyItem.previousOwners = event.previousOwners;

        if (event.constructionStartDate) historyItem.constructionStartDate = format(event.constructionStartDate, 'yyyy-MM-dd');
        if (event.constructionEndDate) historyItem.constructionEndDate = format(event.constructionEndDate, 'yyyy-MM-dd');

        if (event.division40Assets !== undefined) historyItem.division40Assets = event.division40Assets;
        if (event.division43Deductions !== undefined) historyItem.division43Deductions = event.division43Deductions;

        if (event.appreciationValue !== undefined) historyItem.appreciationValue = event.appreciationValue;
        if (event.appreciationDate) historyItem.appreciationDate = format(event.appreciationDate, 'yyyy-MM-dd');

        if (event.subdivisionDetails) historyItem.subdivisionDetails = event.subdivisionDetails;

        if (event.costBases && event.costBases.length > 0) {
          historyItem.costBases = event.costBases;
        }

        if (event.depreciatingAssetsValue !== undefined) {
          historyItem.depreciatingAssetsValue = event.depreciatingAssetsValue;
        }

        return historyItem;
      });

      return {
        id: property.id,
        address: `${property.name}${property.address ? ', ' + property.address : ''}`,
        property_history,
        notes: property.currentStatus || 'No notes',
        color: property.color,
        isRental: property.isRental,
        owners: property.owners,
        currentValue: property.currentValue,
        branch: property.branch,
        parentPropertyId: property.parentPropertyId,
        subdivisionDate: property.subdivisionDate ? format(property.subdivisionDate, 'yyyy-MM-dd') : undefined,
        subdivisionGroup: property.subdivisionGroup,
        lotNumber: property.lotNumber,
        lotSize: property.lotSize,
        allocationPercentage: property.allocationPercentage,
        initialCostBase: property.initialCostBase,
        isMainLotContinuation: property.isMainLotContinuation,
      };
    }),
    user_query: "Please analyze my property portfolio with accurate CGT calculations including all cost base elements.",
    additional_info: {
      australian_resident: true,
      tax_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    }
  };
}
