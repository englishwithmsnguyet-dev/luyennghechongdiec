import re
import sys

input_file = 'day12.txt'
day_index = 12
audio1 = 'day12_practice06.mp3'

with open(input_file, 'r', encoding='utf-8') as f:
    lines = [line.strip() for line in f if line.strip()]

questions = []

current_q = {}
mode = None

for line in lines:
    if line.startswith('PRACTICE'):
        continue
    
    m_en_q = re.match(r'^(\d+)\.\s+([a-zA-Z].*\?)', line)
    if m_en_q:
        if re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', line, re.IGNORECASE):
            current_q['questionVN'] = line
            mode = 'vn_q'
        else:
            if current_q.get('transcriptVN'):
                questions.append(current_q)
            current_q = {'questionEN': line, 'optionsEN': [], 'optionsVN': [], 'correctAnswer': 'A'}
            mode = 'en_q'
        continue
        
    m_vn_q = re.match(r'^(\d+)\.\s+(.*)', line)
    if m_vn_q and mode == 'en_trans':
        current_q['questionVN'] = line
        mode = 'vn_q'
        continue
        
    m_opt = re.match(r'^([A-D])\.\s*(.*)', line)
    if m_opt:
        is_correct = '✅' in line
        opt_text = m_opt.group(2).replace('✅', '').strip()
        if mode == 'en_q':
            current_q['optionsEN'].append({'id': m_opt.group(1), 'text': opt_text})
            if is_correct:
                current_q['correctAnswer'] = m_opt.group(1)
        elif mode == 'vn_q':
            current_q['optionsVN'].append({'id': m_opt.group(1), 'text': opt_text})
            if is_correct:
                current_q['correctAnswer'] = m_opt.group(1)
        continue
        
    if mode == 'en_q' and len(current_q['optionsEN']) == 4:
        mode = 'en_trans'
        current_q['transcriptEN'] = [line]
    elif mode == 'en_trans':
        current_q['transcriptEN'].append(line)
    elif mode == 'vn_q' and len(current_q['optionsVN']) == 4:
        mode = 'vn_trans'
        current_q['transcriptVN'] = [line]
    elif mode == 'vn_trans':
        current_q['transcriptVN'].append(line)

if current_q.get('transcriptVN'):
    questions.append(current_q)

qs_str = []
for i, q in enumerate(questions):
    opts = []
    for j in range(4):
        e_text = q['optionsEN'][j]['text'].replace('"', '\\"') if j < len(q['optionsEN']) else ""
        v_text = q['optionsVN'][j]['text'].replace('"', '\\"') if j < len(q['optionsVN']) else ""
        opts.append(f"{{ id: '{chr(65+j)}', textEN: \"{e_text}\", textVN: \"{v_text}\" }}")
    
    opts_str = ',\n          '.join(opts)
    
    q_en = q['questionEN'].replace('"', '\\"')
    q_vn = q['questionVN'].replace('"', '\\"')
    t_en = ' '.join(q['transcriptEN']).replace('"', '\\"')
    t_vn = ' '.join(q['transcriptVN']).replace('"', '\\"')
    
    qs_str.append(f"""
          {{
            id: {i + 1},
            questionEN: "{q_en}",
            questionVN: "{q_vn}",
            options: [
              {opts_str}
            ],
            correctAnswer: '{q.get('correctAnswer', 'A')}',
            transcriptEN: "{t_en}",
            transcriptVN: "{t_vn}"
          }}""")

final_q_str = ','.join(qs_str)

day_data = f"""
  {day_index}: {{
    title: "ENGLISH WITH MISS NGUYET",
    practices: [
      {{
        title: "PRACTICE 01",
        audioSrc: "{audio1}",
        questions: [{final_q_str}
        ]
      }}
    ]
  }}"""

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.strip()
if content.endswith('};'):
    content = content[:-2]
elif content.endswith('}'):
    content = content[:-1]

new_content = content + ",\n" + day_data.lstrip('\n') + "\n};\n"

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully appended Day {day_index} to data.js! Found {len(questions)} questions.")
