/**
 * Australian CGT Cost Base Definitions
 *
 * Based on ATO guidelines for Capital Gains Tax calculations
 * Organized by the 5 CGT cost base elements
 */

export type CostBaseCategory = 'element1' | 'element2' | 'element3' | 'element4' | 'element5';

export interface CostBaseDefinition {
  id: string;
  name: string;
  category: CostBaseCategory;
  description: string;
  applicableEvents: string[];  // Which event types this applies to
  requiresWarning?: boolean;   // Show warning about deductibility
  warningText?: string;
}

/**
 * Comprehensive list of Australian property CGT cost bases
 */
export const COST_BASE_DEFINITIONS: CostBaseDefinition[] = [
  // ===== ELEMENT 1: ACQUISITION COSTS =====
  {
    id: 'purchase_price',
    name: 'Purchase Price',
    category: 'element1',
    description: 'The total amount paid or required to be paid to acquire the property. This is the base acquisition cost and forms the foundation of your CGT cost base calculation.',
    applicableEvents: ['purchase'],
  },
  {
    id: 'land_price',
    name: 'Land Price',
    category: 'element1',
    description: 'The land component of the purchase price when separated from the building value. This distinction is important for depreciation calculations and may be specified in your contract of sale.',
    applicableEvents: ['purchase'],
  },
  {
    id: 'building_price',
    name: 'Building Price',
    category: 'element1',
    description: 'The building or structure component of the purchase price when separated from the land value. This is used for depreciation calculations and capital works deductions.',
    applicableEvents: ['purchase'],
  },

  // ===== ELEMENT 2: INCIDENTAL COSTS (ACQUISITION) =====
  {
    id: 'stamp_duty',
    name: 'Stamp Duty',
    category: 'element2',
    description: 'State government transfer duty (stamp duty) paid on the property acquisition. This is a significant cost that forms part of your CGT cost base and can substantially reduce your capital gain.',
    applicableEvents: ['purchase'],
  },
  {
    id: 'purchase_legal_fees',
    name: 'Legal Fees (Purchase)',
    category: 'element2',
    description: 'Legal and professional fees paid to solicitors or conveyancers for handling the purchase transaction, including contract reviews, title searches, and settlement.',
    applicableEvents: ['purchase'],
  },
  {
    id: 'conveyancing_fees_purchase',
    name: 'Conveyancing Fees (Purchase)',
    category: 'element2',
    description: 'Property transfer costs on acquisition',
    applicableEvents: ['purchase'],
  },
  {
    id: 'valuation_fees',
    name: 'Valuation Fees',
    category: 'element2',
    description: 'Property valuation or appraisal fees',
    applicableEvents: ['purchase', 'move_out', 'refinance'],
  },
  {
    id: 'purchase_agent_fees',
    name: "Buyer's Agent Commission",
    category: 'element2',
    description: 'Agent fees if using a buyer\'s agent',
    applicableEvents: ['purchase'],
  },
  {
    id: 'building_inspection',
    name: 'Building Inspection Fees',
    category: 'element2',
    description: 'Professional building inspection fees paid before purchase to assess the structural condition and identify defects. These pre-acquisition costs are deductible from your capital gain.',
    applicableEvents: ['purchase'],
  },
  {
    id: 'pest_inspection',
    name: 'Pest Inspection Fees',
    category: 'element2',
    description: 'Fees paid for pest and termite inspections conducted before purchase. These incidental acquisition costs form part of your cost base.',
    applicableEvents: ['purchase'],
  },
  {
    id: 'survey_fees',
    name: 'Survey Fees',
    category: 'element2',
    description: 'Land survey costs',
    applicableEvents: ['purchase'],
  },
  {
    id: 'search_fees',
    name: 'Title Search Fees',
    category: 'element2',
    description: 'Title search and land registry fees',
    applicableEvents: ['purchase'],
  },
  {
    id: 'loan_application_fees',
    name: 'Loan Application Fees',
    category: 'element2',
    description: 'Establishment fees for mortgage (if not deductible)',
    applicableEvents: ['purchase', 'refinance'],
    requiresWarning: true,
    warningText: 'Only include if not claimed as a tax deduction',
  },
  {
    id: 'accountant_fees_purchase',
    name: 'Accountant Fees (Purchase)',
    category: 'element2',
    description: 'Accounting costs related to acquisition',
    applicableEvents: ['purchase'],
  },
  {
    id: 'loan_establishment',
    name: 'Loan Establishment Fees',
    category: 'element2',
    description: 'Fees charged by lender for establishing a mortgage loan (if not claimed as a tax deduction)',
    applicableEvents: ['purchase', 'refinance'],
    requiresWarning: true,
    warningText: 'Only include if not claimed as a tax deduction',
  },
  {
    id: 'mortgage_insurance',
    name: "Lender's Mortgage Insurance (LMI)",
    category: 'element2',
    description: "Insurance premium paid for lender's mortgage insurance when borrowing over 80% LVR",
    applicableEvents: ['purchase'],
  },

  // ===== SALE PROCEEDS (Capital Proceeds - not a cost base) =====
  {
    id: 'sale_price',
    name: 'Sale Price',
    category: 'element1', // Used for display purposes
    description: 'The total sale price or capital proceeds received from selling the property.',
    applicableEvents: ['sale'],
  },

  // ===== ELEMENT 2: INCIDENTAL COSTS (DISPOSAL) =====
  {
    id: 'sale_legal_fees',
    name: 'Legal Fees (Sale)',
    category: 'element2',
    description: 'Solicitor or conveyancer fees for sale',
    applicableEvents: ['sale'],
  },
  {
    id: 'conveyancing_fees_sale',
    name: 'Conveyancing Fees (Sale)',
    category: 'element2',
    description: 'Property transfer costs on disposal',
    applicableEvents: ['sale'],
  },
  {
    id: 'sale_agent_fees',
    name: 'Real Estate Agent Commission',
    category: 'element2',
    description: 'Commission and fees paid to real estate agents for selling your property. This is typically a percentage of the sale price and is a significant cost that reduces your capital gain.',
    applicableEvents: ['sale'],
  },
  {
    id: 'advertising_costs',
    name: 'Advertising Costs',
    category: 'element2',
    description: 'Marketing and advertising expenses incurred to sell the property, including online listings, photography, signboards, brochures, and print advertisements.',
    applicableEvents: ['sale'],
  },
  {
    id: 'staging_costs',
    name: 'Property Staging Costs',
    category: 'element2',
    description: 'Professional styling and staging costs to present the property for sale, including furniture hire and interior decoration.',
    applicableEvents: ['sale'],
  },
  {
    id: 'auction_fees',
    name: 'Auction Fees',
    category: 'element2',
    description: 'Auctioneer fees if sold at auction',
    applicableEvents: ['sale'],
  },
  {
    id: 'mortgage_discharge_fees',
    name: 'Mortgage Discharge Fees',
    category: 'element2',
    description: 'Fees to discharge existing mortgage on sale',
    applicableEvents: ['sale'],
  },
  {
    id: 'tax_agent_fees_sale',
    name: 'Tax Agent Fees (Sale)',
    category: 'element2',
    description: 'Accountant fees related to CGT on sale',
    applicableEvents: ['sale'],
  },

  // ===== ELEMENT 3: OWNERSHIP/HOLDING COSTS =====
  {
    id: 'land_tax',
    name: 'Land Tax',
    category: 'element3',
    description: 'State government land tax paid annually on the property. This is a holding cost that can form part of your cost base only if you have not claimed it (and cannot claim it) as a tax deduction.',
    applicableEvents: ['purchase', 'move_in', 'move_out', 'rent_start', 'rent_end', 'status_change'],
    requiresWarning: true,
    warningText: 'Only include if NOT claimed (or cannot be claimed) as a tax deduction. For investment properties where land tax is deductible, do NOT include here.',
  },
  {
    id: 'council_rates',
    name: 'Council Rates',
    category: 'element3',
    description: 'Local council rates (only if not deductible)',
    applicableEvents: ['purchase', 'move_in', 'move_out', 'rent_start', 'rent_end', 'status_change'],
    requiresWarning: true,
    warningText: 'Only include if NOT claimed as a tax deduction',
  },
  {
    id: 'water_rates',
    name: 'Water Rates',
    category: 'element3',
    description: 'Water and sewerage charges (only if not deductible)',
    applicableEvents: ['purchase', 'move_in', 'move_out', 'rent_start', 'rent_end', 'status_change'],
    requiresWarning: true,
    warningText: 'Only include if NOT claimed as a tax deduction',
  },
  {
    id: 'insurance',
    name: 'Property Insurance',
    category: 'element3',
    description: 'Building and contents insurance (only if not deductible)',
    applicableEvents: ['purchase', 'move_in', 'move_out', 'rent_start', 'rent_end', 'status_change'],
    requiresWarning: true,
    warningText: 'Only include if NOT claimed as a tax deduction',
  },
  {
    id: 'body_corporate_fees',
    name: 'Body Corporate/Strata Fees',
    category: 'element3',
    description: 'Strata or body corporate levies (only if not deductible)',
    applicableEvents: ['purchase', 'move_in', 'move_out', 'rent_start', 'rent_end', 'status_change'],
    requiresWarning: true,
    warningText: 'Only include if NOT claimed as a tax deduction',
  },
  {
    id: 'interest_on_borrowings',
    name: 'Interest on Borrowings',
    category: 'element3',
    description: 'Interest paid on loans used to acquire or hold the property. This is only included in the cost base if you have not claimed (and cannot claim) it as a tax deduction. For investment properties, interest is typically deductible and should not be included here.',
    applicableEvents: ['purchase', 'refinance', 'move_in', 'move_out', 'rent_start', 'rent_end'],
    requiresWarning: true,
    warningText: 'Only include if NOT claimed as a tax deduction. For investment properties, interest is usually deductible and should NOT be included.',
  },
  {
    id: 'maintenance_costs',
    name: 'Maintenance Costs',
    category: 'element3',
    description: 'Repairs and maintenance (only if not deductible and not capital improvements)',
    applicableEvents: ['purchase', 'move_in', 'move_out', 'rent_start', 'rent_end', 'status_change'],
    requiresWarning: true,
    warningText: 'Only include if NOT claimed as a tax deduction and NOT capital improvements',
  },
  {
    id: 'emergency_services_levy',
    name: 'Emergency Services Levy',
    category: 'element3',
    description: 'State emergency services charges (only if not deductible)',
    applicableEvents: ['purchase', 'move_in', 'move_out', 'rent_start', 'rent_end', 'status_change'],
    requiresWarning: true,
    warningText: 'Only include if NOT claimed as a tax deduction',
  },

  // ===== ELEMENT 4: CAPITAL IMPROVEMENTS =====
  {
    id: 'renovation_kitchen',
    name: 'Kitchen Renovation',
    category: 'element4',
    description: 'Capital expenditure on complete kitchen replacement or major upgrades that increase or preserve the property\'s value. Note: Regular repairs and maintenance are not capital improvements.',
    applicableEvents: ['improvement'],
  },
  {
    id: 'renovation_bathroom',
    name: 'Bathroom Renovation',
    category: 'element4',
    description: 'Major bathroom replacement or renovation that adds value to the property. This includes new fixtures, tiling, and complete redesigns, but not minor repairs.',
    applicableEvents: ['improvement'],
  },
  {
    id: 'renovation_whole_house',
    name: 'Whole House Renovation',
    category: 'element4',
    description: 'Complete house renovation or refurbishment',
    applicableEvents: ['improvement'],
  },
  {
    id: 'extension',
    name: 'Extension',
    category: 'element4',
    description: 'Additional rooms, second story, or granny flat',
    applicableEvents: ['improvement'],
  },
  {
    id: 'swimming_pool',
    name: 'Swimming Pool',
    category: 'element4',
    description: 'Installation of an in-ground or above-ground swimming pool, including associated equipment, fencing, and landscaping required for the pool area.',
    applicableEvents: ['improvement'],
  },
  {
    id: 'landscaping',
    name: 'Capital Landscaping',
    category: 'element4',
    description: 'Capital works including retaining walls, paved driveways, and permanent landscaping features that add value. Regular garden maintenance is not included.',
    applicableEvents: ['improvement'],
  },
  {
    id: 'garage_carport',
    name: 'Garage/Carport',
    category: 'element4',
    description: 'New garage or carport construction',
    applicableEvents: ['improvement'],
  },
  {
    id: 'fencing',
    name: 'Fencing',
    category: 'element4',
    description: 'New fencing or major fence replacement',
    applicableEvents: ['improvement'],
  },
  {
    id: 'deck_patio',
    name: 'Deck/Patio',
    category: 'element4',
    description: 'Outdoor entertaining area construction',
    applicableEvents: ['improvement'],
  },
  {
    id: 'hvac_system',
    name: 'Heating/Cooling System',
    category: 'element4',
    description: 'Installation of new HVAC or air conditioning systems',
    applicableEvents: ['improvement'],
  },
  {
    id: 'solar_panels',
    name: 'Solar Panels',
    category: 'element4',
    description: 'Solar photovoltaic system installation including panels, inverters, and associated electrical work. This capital improvement can increase property value and forms part of your cost base.',
    applicableEvents: ['improvement'],
  },
  {
    id: 'structural_changes',
    name: 'Structural Changes',
    category: 'element4',
    description: 'Major structural alterations such as removing or adding walls, property reconfiguration, or significant changes to the building layout.',
    applicableEvents: ['improvement'],
  },
  {
    id: 'disability_modifications',
    name: 'Disability Modifications',
    category: 'element4',
    description: 'Ramps, lifts, accessibility improvements',
    applicableEvents: ['improvement'],
  },
  {
    id: 'water_tank',
    name: 'Water Tank',
    category: 'element4',
    description: 'Rainwater tank installation',
    applicableEvents: ['improvement'],
  },
  {
    id: 'shed_outbuilding',
    name: 'Shed/Outbuilding',
    category: 'element4',
    description: 'Permanent shed or outbuilding construction',
    applicableEvents: ['improvement'],
  },

  // Fourth Element - Capital Costs (Non-improvement)
  {
    id: 'zoning_change_costs',
    name: 'Zoning Change Application Costs',
    category: 'element4',
    description: 'Costs of applying for zoning changes (whether successful or not)',
    applicableEvents: ['improvement', 'purchase', 'custom'],
  },
  {
    id: 'asset_installation_costs',
    name: 'Asset Installation Costs',
    category: 'element4',
    description: 'Costs to install an asset on the property',
    applicableEvents: ['improvement', 'purchase', 'custom'],
  },
  {
    id: 'asset_relocation_costs',
    name: 'Asset Moving/Relocation Costs',
    category: 'element4',
    description: 'Costs to move or relocate an asset',
    applicableEvents: ['improvement', 'custom'],
  },

  // ===== ELEMENT 5: TITLE COSTS =====
  {
    id: 'title_legal_fees',
    name: 'Legal Fees (Title Defense)',
    category: 'element5',
    description: 'Legal and professional costs incurred to defend your ownership or title to the property, including court costs and solicitor fees for title-related disputes.',
    applicableEvents: ['purchase', 'status_change'],
  },
  {
    id: 'boundary_dispute',
    name: 'Boundary Dispute Costs',
    category: 'element5',
    description: 'Legal and surveying costs incurred in resolving boundary disputes with neighbors, including court proceedings and professional fees.',
    applicableEvents: ['status_change'],
  },
  {
    id: 'title_insurance',
    name: 'Title Insurance',
    category: 'element5',
    description: 'One-off title insurance premiums',
    applicableEvents: ['purchase'],
  },
  {
    id: 'easement_costs',
    name: 'Easement Legal Costs',
    category: 'element5',
    description: 'Legal costs incurred in establishing, modifying, or defending easements over or affecting your property, including rights of way and utility easements.',
    applicableEvents: ['purchase', 'status_change'],
  },
  {
    id: 'caveat_costs',
    name: 'Caveat Costs',
    category: 'element5',
    description: 'Legal and administrative costs to lodge or remove caveats on the property title to protect or defend your ownership rights.',
    applicableEvents: ['purchase', 'status_change'],
  },
  {
    id: 'partition_action',
    name: 'Partition Action Costs',
    category: 'element5',
    description: 'Legal costs for co-owner disputes',
    applicableEvents: ['status_change'],
  },
  {
    id: 'adverse_possession_defense',
    name: 'Adverse Possession Defense',
    category: 'element5',
    description: 'Costs defending against adverse possession claims',
    applicableEvents: ['status_change'],
  },
];

/**
 * Get cost base definitions applicable to a specific event type
 */
export function getCostBasesForEventType(eventType: string): CostBaseDefinition[] {
  return COST_BASE_DEFINITIONS.filter(cb => cb.applicableEvents.includes(eventType));
}

/**
 * Get cost base definition by ID
 */
export function getCostBaseDefinition(id: string): CostBaseDefinition | undefined {
  return COST_BASE_DEFINITIONS.find(cb => cb.id === id);
}

/**
 * Category display names
 */
export const CATEGORY_NAMES: Record<CostBaseCategory, string> = {
  element1: 'Element 1: Acquisition Costs',
  element2: 'Element 2: Incidental Costs',
  element3: 'Element 3: Holding Costs',
  element4: 'Element 4: Capital Improvements',
  element5: 'Element 5: Title Costs',
};

/**
 * Category descriptions based on ATO guidelines
 */
export const CATEGORY_DESCRIPTIONS: Record<CostBaseCategory, string> = {
  element1: 'The money paid (or required to be paid) for the asset, including the market value of any property given to acquire it.',
  element2: 'Incidental costs incurred when acquiring or disposing of the asset, such as legal fees, agent commissions, stamp duty, and other professional fees.',
  element3: 'Costs of owning the asset (acquired after 20 August 1991), including interest on borrowings, and costs of maintenance, repairs, or insurance. Only include if NOT claimed as tax deductions.',
  element4: 'Capital expenditure incurred for the purpose or with the expected effect of increasing or preserving the asset\'s value.',
  element5: 'Capital costs incurred in preserving or defending your title or rights to the CGT asset.',
};
