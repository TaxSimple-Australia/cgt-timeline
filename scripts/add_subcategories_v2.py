import json
import os
from pathlib import Path

# Define subcategory mapping based on actual scenarios in generate-scenarios-manifest.js
# Organized by category -> subcategory structure
SUBCATEGORY_MAP = {
    # === Main Residence ===
    # Full Exemption
    'batch123_scenario8_full_main_residence.json': 'Full Exemption',
    'batch123_scenario9_moving_between_residences.json': 'Full Exemption',
    'batch123_scenario5_moving_between_residences.json': 'Full Exemption',
    'aged_care_main_residence.json': 'Full Exemption',

    # Partial - 6-Year Rule
    'batch123_scenario2_six_year_within.json': 'Partial - 6-Year Rule',
    'batch123_scenario3_six_year_exceeded.json': 'Partial - 6-Year Rule',
    'batch123_scenario6_six_year_within.json': 'Partial - 6-Year Rule',
    'batch123_scenario7_six_year_exceeded.json': 'Partial - 6-Year Rule',
    'batch123_scenario23_six_year_periods_reset.json': 'Partial - 6-Year Rule',
    'scenario6_multiple_absence_periods.json': 'Partial - 6-Year Rule',
    'scenario23_six_year_periods_reset.json': 'Partial - 6-Year Rule',
    'six_year_rule_exceeded.json': 'Partial - 6-Year Rule',
    'six_year_rule_within_limit.json': 'Partial - 6-Year Rule',
    'six_year_rule_multiple_absences.json': 'Partial - 6-Year Rule',

    # Partial - Time Apportionment
    'batch123_scenario4_rental_first.json': 'Partial - Time Apportionment',
    'batch123_scenario10_rental_first.json': 'Partial - Time Apportionment',
    'batch123_scenario39_investment_then_main_residence.json': 'Partial - Time Apportionment',
    'scenario9_investment_then_ppr_then_rental.json': 'Partial - Time Apportionment',
    'scenario39_investment_then_main_residence.json': 'Partial - Time Apportionment',
    'time_apportionment_multiple_periods.json': 'Partial - Time Apportionment',
    'time_apportionment_with_absence_rule.json': 'Partial - Time Apportionment',

    # Special Circumstances
    'batch123_scenario21_aged_care_indefinite_absence.json': 'Special Circumstances',
    'batch123_scenario22_delayed_move_in_work.json': 'Special Circumstances',
    'batch123_scenario34_vacant_periods_extended_rental.json': 'Special Circumstances',
    'scenario22_delayed_move_in_work.json': 'Special Circumstances',
    'scenario34_vacant_periods_extended_rental.json': 'Special Circumstances',
    'first_use_overseas_posting.json': 'Special Circumstances',
    'main_residence_land_exceeds_2ha.json': 'Special Circumstances',
    'six_month_overlap_old_home_rented.json': 'Special Circumstances',

    # === Ownership Changes ===
    # Inheritance/Death
    'batch123_scenario24_deceased_estate_two_years.json': 'Inheritance/Death',
    'batch123_scenario25_beneficiary_moves_in.json': 'Inheritance/Death',
    'batch123_scenario37_deceased_estate_covid.json': 'Inheritance/Death',
    'scenario8_inherited_property_rental.json': 'Inheritance/Death',
    'death_of_joint_owner.json': 'Inheritance/Death',
    'executor_sale_before_distribution.json': 'Inheritance/Death',
    'inherited_land_built_dwelling_then_sold.json': 'Inheritance/Death',
    'inherited_land_farmland_subdivided_sold.json': 'Inheritance/Death',
    'inherited_land_vacant_pre_cgt_deceased.json': 'Inheritance/Death',
    'inherited_property_2year_rule.json': 'Inheritance/Death',
    'multiple_beneficiaries.json': 'Inheritance/Death',
    'pre_cgt_inheritance.json': 'Inheritance/Death',

    # Relationships
    'batch123_scenario29_relationship_breakdown.json': 'Relationships',
    'defacto_breakdown_rollover.json': 'Relationships',
    'divorce_complex_mre_then_rented_after_transfer.json': 'Relationships',
    'investment_property_divorce_transfer.json': 'Relationships',
    'joint_sale_during_separation.json': 'Relationships',
    'relationship_breakdown_rollover.json': 'Relationships',

    # Trust & Entity
    'bare_trust_no_cgt.json': 'Trust & Entity',
    'transfer_to_family_trust.json': 'Trust & Entity',
    'trust_distribution_to_beneficiary.json': 'Trust & Entity',

    # === Special Rules & Exemptions ===
    # Construction Rules
    'batch123_scenario35_four_year_construction.json': 'Construction Rules',
    'scenario11_construction_four_year_rule.json': 'Construction Rules',
    'two_year_building_rule_exceeded.json': 'Construction Rules',
    'two_year_building_rule_renovation.json': 'Construction Rules',

    # Partial Use
    'batch123_scenario27_large_rural_property.json': 'Partial Use',
    'batch123_scenario28_granny_flat_arrangement.json': 'Partial Use',
    'batch123_scenario30_home_office_business.json': 'Partial Use',
    'scenario12_airbnb_room_rental.json': 'Partial Use',
    'scenario27_large_rural_property.json': 'Partial Use',
    'scenario28_granny_flat_arrangement.json': 'Partial Use',
    'airbnb_investment_only.json': 'Partial Use',
    'airbnb_spare_room.json': 'Partial Use',

    # Pre-CGT
    'batch123_scenario26_pre_cgt_major_improvements.json': 'Pre-CGT',
    'scenario26_pre_cgt_major_improvements.json': 'Pre-CGT',
    'pre_cgt_property_with_improvements.json': 'Pre-CGT',

    # Other
    'batch123_scenario38_small_business_15_year.json': 'Other',
    'joint_tenants_equal_split.json': 'Other',

    # === Subdivision (no subcategory - flat) ===
    'scenario36_subdivision_land_sale.json': None,
    'subdivision_build_and_sell.json': None,
    'subdivision_main_residence_vacant_land.json': None,
    'subdivision_multiple_lots_sold.json': None,
    'subdivision_pre_cgt_property.json': None,
    'subdivision_retain_dwelling_sell_vacant.json': None,
    'subdivision_strata_title.json': None,

    # === Multi-Property Portfolios (no subcategory - flat) ===
    'batch123_scenario33_spouses_different_residences.json': None,
    'batch123_scenario40_four_property_portfolio.json': None,
    'scenario7_two_properties_strategic_mre.json': None,
    'scenario10_six_month_overlap_exceeded.json': None,
    'scenario13_couple_separate_properties.json': None,
    'scenario15_three_property_portfolio.json': None,
    'scenario22_six_month_overlap_exceeded.json': None,
    'scenario33_spouses_different_residences.json': None,
    'joint_ownership_main_residence_choice.json': None,

    # === Foreign Resident (no subcategory - flat) ===
    'batch123_scenario32_pre_may_2012_foreign.json': None,
    'scenario31_foreign_resident_life_event.json': None,
    'scenario32_pre_may_2012_foreign.json': None,
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
        elif 'subcategory' in data.get('additional_info', {}):
            # Remove subcategory if it exists but should be None (flat categories)
            del data['additional_info']['subcategory']

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

    # Check both scenariotestjsons and tests directories
    scenariotestjsons_dir = project_root / 'public' / 'scenariotestjsons'
    tests_dir = project_root / 'public' / 'tests'

    print("Adding subcategories to scenario files...")
    print("-" * 80)

    processed_count = 0
    error_count = 0
    skipped_count = 0

    for filename, subcategory in SUBCATEGORY_MAP.items():
        # Check in scenariotestjsons first
        filepath = scenariotestjsons_dir / filename
        if not filepath.exists():
            # Check in tests directory
            filepath = tests_dir / filename

        if not filepath.exists():
            print(f"[SKIP] File not found: {filename}")
            skipped_count += 1
            continue

        success = add_subcategory_to_file(filepath, subcategory)

        if success:
            status = f"[OK] {filename}"
            if subcategory:
                status += f" -> {subcategory}"
            else:
                status += " -> (flat category)"
            print(status)
            processed_count += 1
        else:
            print(f"[ERROR] {filename}")
            error_count += 1

    print("-" * 80)
    print(f"Processed: {processed_count} files")
    print(f"Errors: {error_count} files")
    print(f"Skipped: {skipped_count} files")
    print(f"Total in map: {len(SUBCATEGORY_MAP)} files")
    print("")
    print("Done!")

if __name__ == "__main__":
    main()
