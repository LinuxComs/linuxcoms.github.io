import os
from pathlib import Path

# ========================= CONFIGURATION =========================
# Change this to your project root if needed
PROJECT_ROOT = "."  # Current directory

# Folders to completely exclude
EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '__pycache__',
    '.venv',
    'venv',
    'env'
}

# File extensions to include (add more if needed)
INCLUDE_EXTENSIONS = {
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.json', '.css', '.html', '.md',
    '.vue', '.svelte', '.astro',
    '.config.js', '.config.ts',
    '.env', '.env.example',
    '.gitignore'
}

# Maximum file size to read (in bytes) - prevents reading huge files
MAX_FILE_SIZE = 500 * 1024  # 500 KB

# Output file
OUTPUT_FILE = "project_code_dump.txt"
# =================================================================

def should_include_file(file_path: Path) -> bool:
    """Check if file should be included."""
    if file_path.stat().st_size > MAX_FILE_SIZE:
        return False
    
    ext = file_path.suffix.lower()
    name = file_path.name.lower()
    
    # Include files with matching extensions OR common config files
    if ext in INCLUDE_EXTENSIONS:
        return True
    
    # Special case for files without extension or common config names
    if name in ['package.json', 'vite.config.js', 'tsconfig.json', 
                'next.config.js', 'tailwind.config.js', '.env']:
        return True
    
    return False


def scrape_project():
    root_path = Path(PROJECT_ROOT).resolve()
    print(f"Scanning project: {root_path}")
    
    collected = []
    skipped_dirs = 0
    skipped_files = 0
    total_files = 0

    for dirpath, dirnames, filenames in os.walk(root_path):
        # Skip excluded directories
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        
        current_path = Path(dirpath)
        rel_dir = current_path.relative_to(root_path)
        
        for filename in filenames:
            total_files += 1
            file_path = current_path / filename
            rel_path = file_path.relative_to(root_path)
            
            if should_include_file(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    collected.append({
                        'path': str(rel_path),
                        'content': content
                    })
                    print(f"✓ Collected: {rel_path}")
                except Exception as e:
                    print(f"✗ Error reading {rel_path}: {e}")
                    skipped_files += 1
            else:
                skipped_files += 1

    # Write to output file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(f"PROJECT CODE DUMP\n")
        f.write(f"Root: {root_path}\n")
        f.write(f"Total files scanned: {total_files}\n")
        f.write(f"Files collected: {len(collected)}\n")
        f.write(f"Skipped: {skipped_files}\n")
        f.write("=" * 80 + "\n\n")
        
        for item in collected:
            f.write(f"{'='*80}\n")
            f.write(f"FILE: {item['path']}\n")
            f.write(f"{'='*80}\n\n")
            f.write(item['content'])
            f.write("\n\n")

    print("\n" + "="*60)
    print(f"✅ Done! Collected {len(collected)} files")
    print(f"📁 Output saved to: {OUTPUT_FILE}")
    print("="*60)


if __name__ == "__main__":
    scrape_project()