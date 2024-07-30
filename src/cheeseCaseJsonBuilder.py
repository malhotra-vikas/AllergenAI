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

for line in lines:
    line = line.strip()

    # Check if line contains allergen markers and more than 7 parts
    if any(marker in line for marker in ["✓", "!"]) and len(line.split()) > 7:
        parts = line.split()
        item_name_parts = []
        allergen_parts = []
        for part in parts:
            if part in ["✓", "!"] and len(allergen_parts) < 7:
                allergen_parts.append(part)
            else:
                item_name_parts.append(part)
        item_name = " ".join(item_name_parts)

        print(item_name)
        allergens = extract_allergens(allergen_parts)
        print(allergens)        

        menu_items.append({
            "item": item_name,
            "allergens": allergens
        })

# Update the JSON structure with the new data
menu_json["menu"] = menu_items

# Save to a JSON file
json_path_final = "/Users/vikas/builderspace/AllergenAI/src/the_cheesecake_factory_allergens_full.json"
with open(json_path_final, 'w') as json_file:
    json.dump(menu_json, json_file, indent=4)

json_path_final
