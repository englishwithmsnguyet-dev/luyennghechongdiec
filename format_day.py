import re
import sys

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
q_count = 0

for line in lines:
    line = line.strip()
    if not line:
        continue
        
    if 'PRACTICE' in line:
        q_count = 0
        new_lines.append(line)
        continue
        
    if line.startswith('•'):
        q_count += 1
        line = line.replace('•', f'{q_count}.', 1)
        
    if re.match(r'^[A-D]\.', line):
        parts = re.split(r'\s+([A-D]\.)\s+', line)
        if len(parts) > 1:
            matches = list(re.finditer(r'([A-D]\.)\s*(.*?)(?=[A-D]\.|$)', line))
            for m in matches:
                new_lines.append(m.group(1) + " " + m.group(2).strip())
            continue
            
    new_lines.append(line)

with open(output_file, 'w', encoding='utf-8') as f:
    for line in new_lines:
        f.write(line + '\n')

print(f"Fixed {input_file} into {output_file}")
