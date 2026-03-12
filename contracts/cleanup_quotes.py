import os

root_dir = "c:/Users/akhil/.gemini/antigravity/scratch/polygon-freelance-marketplace/contracts/contracts"

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith(".sol"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            if '\\"' in content:
                print(f"Fixing {file_path}")
                new_content = content.replace('\\"', '"')
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(new_content)
