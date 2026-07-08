import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'9: \{.*$', content, re.DOTALL)
if match:
    day9_str = match.group(0)
    
    correct_answers = ['C', 'A', 'B', 'C', 'A', 'B', 'D', 'D', 'B', 'A']
    
    def repl(m):
        return f"correctAnswer: '{correct_answers.pop(0)}'"
        
    new_day9_str = re.sub(r"correctAnswer: '[A-D]'", repl, day9_str)
    
    content = content.replace(day9_str, new_day9_str)
    
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed Day 9 answers properly!")
else:
    print("Could not find Day 9")
