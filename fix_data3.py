with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('\n  14: {')
if idx != -1:
    content = content[:idx] + '\n  }\n};\n'

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(content)

