import re
import sys

def parse_file(input_file, day_index, audio1, audio2):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f if line.strip()]

    practices = []
    current_practice = None
    questions = []
    current_q = {}
    mode = None
    
    def finalize_practice():
        if current_practice and questions:
            if current_q and current_q not in questions:
                questions.append(current_q)
            current_practice['questions'] = list(questions)
            practices.append(current_practice)
            questions.clear()

    for line in lines:
        if line.startswith('PRACTICE'):
            finalize_practice()
            current_practice = {'title': line.strip(), 'questions': []}
            mode = 'questions_en'
            current_q = {}
            continue
            
        if line.startswith('TRANSCRIPT'):
            if mode == 'questions_vn':
                mode = 'trans_en'
            elif mode == 'trans_en':
                mode = 'trans_vn'
            continue
            
        if mode == 'questions_en':
            m_en_q = re.match(r'^(\d+)\.\s+(.*)', line)
            is_bullet = line.startswith('•')
            is_vn = re.search(r'[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]', line, re.IGNORECASE)
            
            if (m_en_q or is_bullet) and is_vn:
                # Transition to VN questions
                if current_q and current_q not in questions:
                    questions.append(current_q)
                mode = 'questions_vn'
                
                q_text = m_en_q.group(2).strip() if m_en_q else line.replace('•', '').strip()
                if len(questions) > 0:
                    questions[0]['questionVN'] = q_text
                    current_q = questions[0]
                continue
                
            if m_en_q or is_bullet:
                if current_q and current_q not in questions:
                    questions.append(current_q)
                q_text = m_en_q.group(2).strip() if m_en_q else line.replace('•', '').strip()
                current_q = {'questionEN': q_text, 'optionsEN': [], 'optionsVN': []}
            elif re.match(r'^([A-D])\.\s*(.*)', line):
                m = re.match(r'^([A-D])\.\s*(.*)', line)
                text = m.group(2)
                is_correct = '✅' in text
                text = text.replace('✅', '').strip()
                if 'optionsEN' not in current_q:
                    current_q['optionsEN'] = []
                current_q['optionsEN'].append({'id': m.group(1), 'text': text})
                if is_correct:
                    current_q['correctAnswer'] = m.group(1)
            continue
            
        if mode == 'questions_vn':
            m_vn_q = re.match(r'^(\d+)\.\s+(.*)', line)
            is_bullet = line.startswith('•')
            if m_vn_q or is_bullet:
                q_text = m_vn_q.group(2).strip() if m_vn_q else line.replace('•', '').strip()
                for q in questions:
                    if 'questionVN' not in q:
                        q['questionVN'] = q_text
                        current_q = q
                        break
            elif re.match(r'^([A-D])\.\s*(.*)', line):
                m = re.match(r'^([A-D])\.\s*(.*)', line)
                text = m.group(2)
                is_correct = '✅' in text
                text = text.replace('✅', '').strip()
                if 'optionsVN' not in current_q:
                    current_q['optionsVN'] = []
                current_q['optionsVN'].append({'id': m.group(1), 'text': text})
                if is_correct:
                    current_q['correctAnswer'] = m.group(1)
            elif line.startswith('TRANSCRIPT'):
                mode = 'trans_en'
            continue
            
        if mode == 'trans_en':
            if 'transcriptEN' not in current_practice:
                current_practice['transcriptEN'] = []
            current_practice['transcriptEN'].append(line)
            
        if mode == 'trans_vn':
            if 'transcriptVN' not in current_practice:
                current_practice['transcriptVN'] = []
            current_practice['transcriptVN'].append(line)

    finalize_practice()

    for p in practices:
        t_en = ' '.join(p.get('transcriptEN', []))
        t_vn = ' '.join(p.get('transcriptVN', []))
        for i, q in enumerate(p['questions']):
            q['transcriptEN'] = t_en
            q['transcriptVN'] = t_vn

    practices_str = []
    audios = [audio1, audio2]
    
    for p_idx, p in enumerate(practices):
        qs_str = []
        for i, q in enumerate(p['questions']):
            opts = []
            for j in range(4):
                e_text = q.get('optionsEN', [])[j]['text'].replace('"', '\\"') if j < len(q.get('optionsEN', [])) else ""
                v_text = q.get('optionsVN', [])[j]['text'].replace('"', '\\"') if j < len(q.get('optionsVN', [])) else ""
                opts.append(f"{{ id: '{chr(65+j)}', textEN: \"{e_text}\", textVN: \"{v_text}\" }}")
            
            opts_str = ',\n          '.join(opts)
            
            q_en = q.get('questionEN', '').replace('"', '\\"')
            q_vn = q.get('questionVN', '').replace('"', '\\"')
            t_en = q.get('transcriptEN', '').replace('"', '\\"')
            t_vn = q.get('transcriptVN', '').replace('"', '\\"')
            
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
        practices_str.append(f"""
      {{
        title: "{p['title']}",
        audioSrc: "{audios[p_idx]}",
        questions: [{final_q_str}
        ]
      }}""")

    day_data = f"""
  {day_index}: {{
    title: "ENGLISH WITH MISS NGUYET",
    practices: [{','.join(practices_str)}
    ]
  }}"""

    with open('data.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # REMOVED HACK!
    content = content.strip()
    if content.endswith('};'):
        content = content[:-2]
    elif content.endswith('}'):
        content = content[:-1]

    new_content = content + ",\n" + day_data.lstrip('\n') + "\n};\n"

    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Successfully appended Day {day_index} to data.js! Found {len(practices)} practices.")

parse_file('day13.txt', 13, 'day13_practice07.mp3', 'day13_practice08.mp3')
parse_file('day14.txt', 14, 'day14_practice09.mp3', 'day14_practice10.mp3')
