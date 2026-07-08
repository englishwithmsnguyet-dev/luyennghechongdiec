import re

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find Day 8's portion and replace the answers in order.
# Let's split the content to get Day 8 string.
match = re.search(r'8: \{.*?\};', content, re.DOTALL)
if match:
    day8_str = match.group(0)
    
    correct_answers = ['B', 'A', 'C', 'A', 'C', 'B', 'A', 'A', 'C', 'C']
    new_day8_str = day8_str
    
    for ans in correct_answers:
        new_day8_str = re.sub(r'correctAnswer: \'[A-D]\'', f"correctAnswer: '{ans}'", new_day8_str, count=1)
        
    content = content.replace(day8_str, new_day8_str)
    
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed answers!")
else:
    print("Could not find Day 8")
