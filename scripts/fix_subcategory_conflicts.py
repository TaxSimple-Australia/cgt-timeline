import json
import os
from pathlib import Path

# Files that need subcategory corrections
CORRECTIONS = {
    # File is in "Ownership Changes" but should have "Inheritance/Death" not "Pre-CGT"
    'pre_cgt_property_with_improvements.json': 'Inheritance/Death',

    # File is in "Special Rules & Exemptions" but should have "Other" not "Trust & Entity"
    'bare_trust_no_cgt.json': 'Other',
}

def fix_subcategory(filepath, new_subcategory):
    """Fix subcategory field in a scenario JSON file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Update subcategory in additional_info
        if 'additional_info' not in data:
            data['additional_info'] = {}

        # Set or remove subcategory
        if new_subcategory is not None:
            data['additional_info']['subcategory'] = new_subcategory
        elif 'subcategory' in data['additional_info']:
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
    tests_dir = project_root / 'public' / 'tests'

    print("Fixing subcategory conflicts...")
    print("-" * 80)

    for filename, new_subcategory in CORRECTIONS.items():
        filepath = tests_dir / filename

        if not filepath.exists():
            print(f"[SKIP] File not found: {filename}")
            continue

        success = fix_subcategory(filepath, new_subcategory)

        if success:
            status = f"[OK] {filename}"
            if new_subcategory:
                status += f" -> {new_subcategory}"
            else:
                status += " -> (removed subcategory)"
            print(status)
        else:
            print(f"[ERROR] {filename}")

    print("-" * 80)
    print("Done!")

if __name__ == "__main__":
    main()
