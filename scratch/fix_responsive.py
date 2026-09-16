import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. w-[Xpx] -> w-[min(100%,_Xpx)]
    content = re.sub(r'(?<!\-)w-\[([0-9.]+)px\]', r'w-[min(100%,_\1px)]', content)
    
    # 2. min-w-[Xpx] -> min-w-[min(100%,_Xpx)]
    content = re.sub(r'min-w-\[([0-9.]+)px\]', r'min-w-[min(100%,_\1px)]', content)

    # 3. max-w-[Xpx] -> max-w-[min(100%,_Xpx)]
    content = re.sub(r'max-w-\[([0-9.]+)px\]', r'max-w-[min(100%,_\1px)]', content)

    # 4. text-[Xpx] -> standard classes
    def replace_text(match):
        val = float(match.group(1))
        if val <= 12: return 'text-xs'
        elif val <= 14: return 'text-sm'
        elif val <= 16: return 'text-base'
        elif val <= 18: return 'text-lg'
        elif val <= 20: return 'text-xl'
        elif val <= 24: return 'text-2xl'
        elif val <= 30: return 'text-3xl'
        else: return f'text-[clamp(1rem,3vw,{val}px)]' # responsive clamp
        
    content = re.sub(r'text-\[([0-9.]+)px\]', replace_text, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    src_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.jsx'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
