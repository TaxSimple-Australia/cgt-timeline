import json
import os
from pathlib import Path

# Define subcategory mapping
SUBCATEGORY_MAP = {
    # Main Residence - Full Exemption
    "batch123_scenario1_full_main_residence_exemption.json": "Full Exemption",
    "batch123_scenario8_full_main_residence.json": "Full Exemption",
    "batch123_scenario9_moving_between_residences.json": "Full Exemption",
    "batch123_scenario24_aged_care_scenario.json": "Full Exemption",
    "main_residence_full_exemption.json": "Full Exemption",

    # Main Residence - Partial - 6-Year Rule
    "batch123_scenario2_six_year_within.json": "Partial - 6-Year Rule",
    "batch123_scenario3_six_year_exceeded.json": "Partial - 6-Year Rule",
    "batch123_scenario6_six_year_exceeded_multi_rental.json": "Partial - 6-Year Rule",
    "batch123_scenario7_six_year_within_multi_absence.json": "Partial - 6-Year Rule",
    "batch123_scenario10_six_year_exceeded_then_return.json": "Partial - 6-Year Rule",
    "batch123_scenario15_six_year_partial_rental.json": "Partial - 6-Year Rule",
    "batch123_scenario16_six_year_partial_business.json": "Partial - 6-Year Rule",
    "main_residence_six_year_exceeded.json": "Partial - 6-Year Rule",
    "main_residence_six_year_within.json": "Partial - 6-Year Rule",
    "six_year_rule_exceeded.json": "Partial - 6-Year Rule",
    "six_year_rule_within.json": "Partial - 6-Year Rule",

    # Main Residence - Partial - Time Apportionment
    "batch123_scenario4_rental_first.json": "Partial - Time Apportionment",
    "batch123_scenario11_rental_then_move_in.json": "Partial - Time Apportionment",
    "batch123_scenario12_move_in_then_rental.json": "Partial - Time Apportionment",
    "main_residence_partial_rental.json": "Partial - Time Apportionment",

    # Main Residence - Special Circumstances
    "batch123_scenario5_moving_between_residences.json": "Special Circumstances",
    "batch123_scenario13_partial_rental_concurrent.json": "Special Circumstances",
    "batch123_scenario14_partial_business_concurrent.json": "Special Circumstances",
    "batch123_scenario17_mixed_use_concurrent.json": "Special Circumstances",
    "batch123_scenario18_mixed_use_sequential.json": "Special Circumstances",
    "batch123_scenario19_overseas_absence.json": "Special Circumstances",
    "batch123_scenario20_multiple_absences.json": "Special Circumstances",
    "batch123_scenario21_work_related_absence.json": "Special Circumstances",
    "batch123_scenario22_health_related_absence.json": "Special Circumstances",

    # Ownership Changes - Inheritance/Death
    "batch123_scenario24_deceased_estate_two_years.json": "Inheritance/Death",
    "batch123_scenario36_deceased_estate_immediate_sale.json": "Inheritance/Death",
    "batch123_scenario37_deceased_estate_delayed_sale.json": "Inheritance/Death",
    "batch123_scenario38_deceased_estate_rental_before_sale.json": "Inheritance/Death",
    "batch123_scenario39_deceased_estate_improvements_before_sale.json": "Inheritance/Death",
    "batch123_scenario40_inherited_property_lived_in.json": "Inheritance/Death",
    "batch123_scenario41_inherited_property_rented_out.json": "Inheritance/Death",
    "batch123_scenario42_inherited_property_sold_immediately.json": "Inheritance/Death",
    "batch123_scenario58_estate_inherited_pre_cgt.json": "Inheritance/Death",
    "batch123_scenario59_estate_inherited_partial_exemption.json": "Inheritance/Death",
    "batch123_scenario61_deceased_estate_six_year_rule.json": "Inheritance/Death",
    "deceased_estate_immediate_sale.json": "Inheritance/Death",
    "deceased_estate_two_years.json": "Inheritance/Death",

    # Ownership Changes - Relationships
    "batch123_scenario29_relationship_breakdown.json": "Relationships",
    "batch123_scenario43_divorce_property_transfer.json": "Relationships",
    "batch123_scenario44_divorce_sale_after_transfer.json": "Relationships",
    "batch123_scenario45_divorce_both_parties_keep_property.json": "Relationships",
    "batch123_scenario53_marriage_property_transfer.json": "Relationships",
    "relationship_breakdown.json": "Relationships",

    # Ownership Changes - Trust & Entity
    "bare_trust_no_cgt.json": "Trust & Entity",
    "trust_beneficiary_rollover.json": "Trust & Entity",
    "batch123_scenario30_trust_distribution.json": "Trust & Entity",
    "batch123_scenario64_company_property_disposal.json": "Trust & Entity",

    # Special Rules & Exemptions - Construction Rules
    "batch123_scenario35_four_year_construction.json": "Construction Rules",
    "batch123_scenario47_construction_exceeded_four_years.json": "Construction Rules",
    "batch123_scenario48_construction_within_four_years.json": "Construction Rules",
    "four_year_construction.json": "Construction Rules",

    # Special Rules & Exemptions - Partial Use
    "batch123_scenario28_granny_flat_arrangement.json": "Partial Use",
    "batch123_scenario49_home_office_business_use.json": "Partial Use",
    "batch123_scenario50_home_business_separate_structure.json": "Partial Use",
    "batch123_scenario51_partial_rental_floor_area.json": "Partial Use",
    "batch123_scenario52_partial_business_floor_area.json": "Partial Use",
    "granny_flat_arrangement.json": "Partial Use",

    # Special Rules & Exemptions - Pre-CGT
    "batch123_scenario26_pre_cgt_major_improvements.json": "Pre-CGT",
    "batch123_scenario57_pre_cgt_no_improvements.json": "Pre-CGT",
    "pre_cgt_major_improvements.json": "Pre-CGT",

    # Special Rules & Exemptions - Other
    "batch123_scenario27_large_rural_property.json": "Other",
    "batch123_scenario31_small_business_cgt_concessions.json": "Other",
    "batch123_scenario32_affordable_housing_exemption.json": "Other",
    "batch123_scenario33_heritage_property.json": "Other",

    # Subdivision (flat category)
    "batch123_scenario34_subdivision_simple.json": None,
    "batch123_scenario65_subdivision_two_lots.json": None,
    "batch123_scenario66_subdivision_three_lots_varied_sale.json": None,
    "batch123_scenario67_subdivision_with_retained_lot.json": None,
    "batch123_scenario68_subdivision_immediate_sale.json": None,
    "batch123_scenario69_subdivision_delayed_sale.json": None,
    "batch123_scenario70_subdivision_with_improvements.json": None,
    "batch123_scenario71_subdivision_partial_main_residence.json": None,
    "batch123_scenario72_subdivision_rental_to_sale.json": None,
    "batch123_scenario73_subdivision_mixed_use.json": None,
    "subdivision_simple.json": None,

    # Multi-Property (flat category)
    "batch123_scenario74_two_properties_ppr_rental.json": None,
    "batch123_scenario75_three_properties_varied_status.json": None,
    "batch123_scenario76_property_swap_between_ppr_rental.json": None,
    "batch123_scenario77_multiple_sales_same_year.json": None,
    "batch123_scenario78_portfolio_partial_sales.json": None,
    "multi_property_ppr_rental.json": None,

    # Foreign Resident (flat category)
    "batch123_scenario79_foreign_resident_no_exemption.json": None,
    "batch123_scenario80_foreign_resident_treaty.json": None,
    "batch123_scenario81_became_foreign_resident.json": None,
    "batch123_scenario82_ceased_foreign_resident.json": None,
    "batch123_scenario83_foreign_resident_rental.json": None,
    "foreign_resident_no_exemption.json": None,

    # Complex Scenarios (flat category)
    "batch123_scenario84_multiple_events_timeline.json": None,
    "batch123_scenario85_comprehensive_portfolio.json": None,
    "batch123_scenario86_business_to_residential_conversion.json": None,
    "batch123_scenario87_residential_to_business_conversion.json": None,
    "batch123_scenario88_rural_to_residential_subdivision.json": None,
    "batch123_scenario89_coastal_property_development.json": None,
    "batch123_scenario90_commercial_property_disposal.json": None,
    "complex_multiple_events.json": None,
}

def add_subcategory_to_file(filepath, subcategory):
    """Add subcategory field to a scenario JSON file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Add subcategory to additional_info
        if 'additional_info' not in data:
            data['additional_info'] = {}

        # Only add if subcategory is not None (hierarchical categories only)
        if subcategory is not None:
            data['additional_info']['subcategory'] = subcategory

        # Write back to file
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    # Get the project root directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    scenarios_dir = project_root / 'public' / 'scenariotestjsons'

    print(f"Processing scenarios in: {scenarios_dir}")
    print("-" * 80)

    processed_count = 0
    error_count = 0

    for filename, subcategory in SUBCATEGORY_MAP.items():
        filepath = scenarios_dir / filename

        if not filepath.exists():
            print(f"[SKIP] File not found: {filename}")
            continue

        success = add_subcategory_to_file(filepath, subcategory)

        if success:
            status = f"[OK] {filename}"
            if subcategory:
                status += f" -> {subcategory}"
            else:
                status += " -> (no subcategory - flat category)"
            print(status)
            processed_count += 1
        else:
            print(f"[ERROR] {filename}")
            error_count += 1

    print("-" * 80)
    print(f"Processed: {processed_count} files")
    print(f"Errors: {error_count} files")
    print(f"Total in map: {len(SUBCATEGORY_MAP)} files")

if __name__ == "__main__":
    main()
