import json
import fitz  # This is the correct import for PyMuPDF

# Load the JSON structure
json_path = "/Users/vikas/builderspace/AllergenAI/src/the_cheesecake_factory_allergens.json"
with open(json_path, 'r') as json_file:
    menu_json = json.load(json_file)

# Extract text from all pages
pdf_document = fitz.open("/Users/vikas/builderspace/AllergenAI/src/Allergy_The Cheesecake Factory.pdf")

# Extract text from all pages
pdf_text = ""
for page_num in range(pdf_document.page_count):
    page = pdf_document.load_page(page_num)
    pdf_text += page.get_text()

# Process the text to create a JSON of menu items and their allergens
lines = pdf_text.split("\n")
print(lines)

allergen_keys = ["milk", "peanuts", "sesame", "shellfish", "soy", "tree nuts", "wheat"]
menu_items = menu_json["menu"]

# Helper function to extract allergens from the line
def extract_allergens(parts):
    allergens = {
        "contains": [],
        "mayContain": []
    }
    for i, key in enumerate(allergen_keys):
        if i < len(parts):
            if parts[i] == "✓":
                allergens["contains"].append(key)
            elif parts[i] == "!":
                allergens["mayContain"].append(key)
    return allergens

# Process the lines to extract menu items and allergens
index = 0
while index < len(lines):
    line = lines[index].strip()

    # Check if line looks like a menu item (not starting with an allergen marker and not empty)
    if line and not any(marker in line for marker in ["✓", "!"]):
        item_name = line
        index += 1
        allergen_parts = []

        # Collect allergen markers (up to 7 parts)
        while index < len(lines) and len(allergen_parts) < 7 and any(marker in lines[index] for marker in ["✓", "!"]):
            allergen_parts.append(lines[index].strip())
            index += 1

        # Extract allergens for the item
        allergens = extract_allergens(allergen_parts)
        print(f"Item: {item_name}, Allergens: {allergens}")

        menu_items.append({
            "item": item_name,
            "allergens": allergens
        })
    else:
        index += 1

# Update the JSON structure with the new data
menu_json["menu"] = menu_items

# Save to a JSON file
json_path_final = "/Users/vikas/builderspace/AllergenAI/src/the_cheesecake_factory_allergens_full.json"
with open(json_path_final, 'w') as json_file:
    json.dump(menu_json, json_file, indent=4)

print(f"Updated JSON saved to {json_path_final}")
