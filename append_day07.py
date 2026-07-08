import re

def clean_text(text):
    if not text: return ""
    return text.replace('✅', '').strip()

def parse_file_nested(filename, day_index, practice_titles, audios):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f if line.strip()]
    
    questions = []
    
    en_q_block = []
    vn_q_block = []
    en_trans_block = []
    vn_trans_block = []
    
    mode = 'enQ'
    
    def process_blocks(en_qs, vn_qs, en_tr, vn_tr):
        if not en_qs: return
        
        parsed_en_qs = []
        curr = None
        for l in en_qs:
            m_opt = re.match(r'^([A-D])\.\s*(.*)', l)
            check_correct = '✅' in l
            if m_opt:
                if curr:
                    curr['options'].append({'id': m_opt.group(1), 'text': clean_text(m_opt.group(2))})
                    if check_correct: curr['correctAnswer'] = m_opt.group(1)
            else:
                m_q = re.match(r'^(?:\d+\.|•)\s*(.*)', l)
                if m_q or re.match(r'^\d+\.', l):
                    if curr: parsed_en_qs.append(curr)
                    curr = {'text': clean_text(l), 'options': [], 'correctAnswer': ''}
        if curr: parsed_en_qs.append(curr)
        
        parsed_vn_qs = []
        curr = None
        for l in vn_qs:
            m_opt2 = re.match(r'^([A-D])\.\s*(.*)', l.replace('✅', '').strip())
            check_correct = '✅' in l
            if m_opt2:
                if curr:
                    curr['options'].append({'id': m_opt2.group(1), 'text': clean_text(m_opt2.group(2))})
                    if check_correct and len(parsed_vn_qs) - 1 < len(parsed_en_qs):
                        parsed_en_qs[len(parsed_vn_qs)-1]['correctAnswer'] = m_opt2.group(1)
            else:
                m_q = re.match(r'^(?:\d+\.|•)\s*(.*)', l)
                if m_q or re.match(r'^\d+\.', l) or l.startswith('•'):
                    if curr: parsed_vn_qs.append(curr)
                    curr = {'text': clean_text(l), 'options': []}
        if curr: parsed_vn_qs.append(curr)
        
        trans_en_str = ' '.join(en_tr).replace('"', '\\"')
        trans_vn_str = ' '.join(vn_tr).replace('"', '\\"')
        
        for i, eq in enumerate(parsed_en_qs):
            vq = parsed_vn_qs[i] if i < len(parsed_vn_qs) else {'text': '', 'options': []}
            
            opts = []
            for j in range(4):
                eid = eq['options'][j]['id'] if j < len(eq['options']) else chr(65+j)
                etxt = eq['options'][j]['text'] if j < len(eq['options']) else ""
                vtxt = vq['options'][j]['text'] if j < len(vq['options']) else ""
                e_clean = etxt.replace('"', '\\"')
                v_clean = vtxt.replace('"', '\\"')
                opts.append(f"{{ id: '{eid}', textEN: \"{e_clean}\", textVN: \"{v_clean}\" }}")
            
            opts_str = ',\n          '.join(opts)
            correct = eq.get('correctAnswer') or 'A'
            
            eq_clean = eq['text'].replace('"', '\\"')
            vq_clean = vq['text'].replace('"', '\\"')
            questions.append(f"""
          {{
            id: {len(questions) + 1},
            questionEN: "{eq_clean}",
            questionVN: "{vq_clean}",
            options: [
              {opts_str}
            ],
            correctAnswer: '{correct}',
            transcriptEN: "{trans_en_str}",
            transcriptVN: "{trans_vn_str}"
          }}""")

    for line in lines:
        if 'PRACTICE 0' in line or 'PRACTICE 01' in line or 'PRACTICE 02' in line or 'PRACTICE 03' in line or 'PRACTICE 04' in line or 'PRACTICE 05' in line or 'PRACTICE 06' in line:
            if en_q_block and mode == 'vnTrans':
                process_blocks(en_q_block, vn_q_block, en_trans_block, vn_trans_block)
                en_q_block = []
                vn_q_block = []
                en_trans_block = []
                vn_trans_block = []
                mode = 'enQ'
            continue
            
        if line == 'TRANSCRIPT':
            if mode in ['vnQ', 'enQ']: mode = 'enTrans'
            elif mode == 'enTrans': mode = 'vnTrans'
            continue
            
        # Add dynamic check for vietnamese characters
        if mode == 'enQ' and re.match(r'^(?:\d+\.|•)\s+', line):
            if re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', line, re.IGNORECASE):
                mode = 'vnQ'
                
        if mode == 'enQ': en_q_block.append(line)
        elif mode == 'vnQ': vn_q_block.append(line)
        elif mode == 'enTrans': en_trans_block.append(line)
        elif mode == 'vnTrans': vn_trans_block.append(line)
        
    if en_q_block:
        process_blocks(en_q_block, vn_q_block, en_trans_block, vn_trans_block)
        
    mid = len(questions) // 2
    q1_str = ','.join(questions[:mid])
    q2_str = ','.join(questions[mid:])
    
    return f"""
  {day_index}: {{
    title: "ENGLISH WITH MISS NGUYET",
    practices: [
      {{
        title: "{practice_titles[0]}",
        audioSrc: "{audios[0]}",
        questions: [{q1_str}
        ]
      }},
      {{
        title: "{practice_titles[1]}",
        audioSrc: "{audios[1]}",
        questions: [{q2_str}
        ]
      }}
    ]
  }}"""

day7 = parse_file_nested('day07_fixed.txt', 7, ["PRACTICE 01", "PRACTICE 02"], ["day07_practice01.mp3", "day07_practice02.mp3"])

with open('data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the closing bracket of daysData
content = content.strip()
if content.endswith('};'):
    content = content[:-2]
elif content.endswith('}'):
    content = content[:-1]

# Append day7
new_content = content + ",\n" + day7.lstrip('\n') + "\n};\n"

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully appended Day 7 to data.js!")
