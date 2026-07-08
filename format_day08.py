import re

with open('day08.txt', 'r', encoding='utf-8') as f:
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
        
    # Split A. and B. if they are on same line
    # Match something like "A. ... B. ..."
    if re.match(r'^[A-D]\.', line):
        parts = re.split(r'\s+([A-D]\.)\s+', line)
        if len(parts) > 1:
            # parts will be like: ['', 'A.', 'text text', 'B.', 'text text']
            # wait, the first token is A., so parts[0] is '', parts[1] is 'A.', parts[2] is text.
            # but re.split behavior with grouping keeps the delimiter.
            # Let's just use findall
            matches = list(re.finditer(r'([A-D]\.)\s*(.*?)(?=[A-D]\.|$)', line))
            for m in matches:
                new_lines.append(m.group(1) + " " + m.group(2).strip())
            continue
            
    new_lines.append(line)

with open('day08_fixed.txt', 'w', encoding='utf-8') as f:
    for line in new_lines:
        f.write(line + '\n')

print("Fixed day08.txt into day08_fixed.txt")
