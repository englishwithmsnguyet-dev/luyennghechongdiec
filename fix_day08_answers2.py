import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'8: \{.*$', content, re.DOTALL)
if match:
    day8_str = match.group(0)
    
    correct_answers = ['B', 'A', 'C', 'A', 'C', 'B', 'A', 'A', 'C', 'C']
    
    def repl(m):
        return f"correctAnswer: '{correct_answers.pop(0)}'"
        
    new_day8_str = re.sub(r"correctAnswer: '[A-D]'", repl, day8_str)
    
    content = content.replace(day8_str, new_day8_str)
    
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed answers properly!")
else:
    print("Could not find Day 8")
