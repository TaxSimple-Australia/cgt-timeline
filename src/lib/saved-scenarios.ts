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

const STORAGE_KEY = 'cgt-brain-saved-scenarios';

// ===== CRUD Operations =====

export function getAllSavedScenarios(): SavedScenario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const scenarios: SavedScenario[] = JSON.parse(raw);
    return scenarios.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error('❌ Failed to read saved scenarios:', err);
    return [];
  }
}

export function getSavedScenario(id: string): SavedScenario | null {
  const all = getAllSavedScenarios();
  return all.find(s => s.id === id) || null;
}

export function saveScenario(metadata: SavedScenarioMetadata, scenarioData: any): SavedScenario {
  const now = new Date().toISOString();
  const scenario: SavedScenario = {
    ...metadata,
    id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    scenarioData,
    createdAt: now,
    updatedAt: now,
  };

  const all = getAllSavedScenarios();
  all.push(scenario);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  console.log(`✅ Saved scenario: ${scenario.title} (${scenario.id})`);
  return scenario;
}

export function updateScenario(id: string, updates: Partial<SavedScenarioMetadata>): SavedScenario | null {
  const all = getAllSavedScenarios();
  const idx = all.findIndex(s => s.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  console.log(`✅ Updated scenario metadata: ${all[idx].title}`);
  return all[idx];
}

export function updateScenarioData(id: string, scenarioData: any): SavedScenario | null {
  const all = getAllSavedScenarios();
  const idx = all.findIndex(s => s.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    scenarioData,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  console.log(`✅ Updated scenario data: ${all[idx].title}`);
  return all[idx];
}

export function deleteSavedScenario(id: string): void {
  const all = getAllSavedScenarios();
  const filtered = all.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  console.log(`🗑️ Deleted scenario: ${id}`);
}

// ===== Category Helpers =====

export function getUsedCategories(): string[] {
  const all = getAllSavedScenarios();
  const categories = new Set(all.map(s => s.category).filter(Boolean));
  return Array.from(categories).sort();
}

export function getUsedSubcategories(category?: string): string[] {
  const all = getAllSavedScenarios();
  const filtered = category ? all.filter(s => s.category === category) : all;
  const subcategories = new Set(filtered.map(s => s.subcategory).filter((s): s is string => !!s));
  return Array.from(subcategories).sort();
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
