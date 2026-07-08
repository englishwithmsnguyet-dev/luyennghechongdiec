const fs = require('fs');

function cleanText(text) {
    if(!text) return "";
    return text.replace(/✅/g, '').trim();
}

function parseFile(filename, dayIndex, audios) {
    const text = fs.readFileSync(filename, 'utf-8');
    const lines = text.split('\n');
    
    let currentPart = 1; // 1 or 2
    let state = 'WAIT_Q_EN';
    let questions = [];
    
    let currentQ = {};
    let optionsEN = [];
    let optionsVN = [];
    let correctAns = '';
    
    let transEN = [];
    let transVN = [];
    
    // Quick regexes
    const qRe = /^(?:\d+\.|•)\s*(.*)/;
    const optRe = /^([A-D])\.\s*(.*)/;
    
    // First pass, extract all English questions, VN questions, English transcripts, VN transcripts
    let enQBlock = [];
    let vnQBlock = [];
    let enTransBlock = [];
    let vnTransBlock = [];
    
    let mode = 'enQ'; // enQ -> vnQ -> enTrans -> vnTrans -> repeat for Part 2
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') continue;
        
        if (line.includes('PRACTICE 0') || line.includes('PRACTICE 01') || line.includes('PRACTICE 02') || line.includes('PRACTICE 03') || line.includes('PRACTICE 04') || line.includes('PRACTICE 05') || line.includes('PRACTICE 06')) {
            if (enQBlock.length > 0 && mode === 'vnTrans') {
                // Next part
                processBlocks(enQBlock, vnQBlock, enTransBlock, vnTransBlock, questions);
                enQBlock = [];
                vnQBlock = [];
                enTransBlock = [];
                vnTransBlock = [];
                mode = 'enQ';
            }
            continue;
        }
        
        if (line === 'TRANSCRIPT') {
            if (mode === 'vnQ' || mode === 'enQ') {
                mode = 'enTrans';
            } else if (mode === 'enTrans') {
                mode = 'vnTrans';
            }
            continue;
        }
        
        // If we see Vietnamese question 1 again, it means we switch to vnQ
        if (mode === 'enQ' && (line.match(/^1\.\s+Theo giáo sư/) || line.match(/^1\.\s+Tại sao/) || line.match(/^1\.\s+Thị trấn/) || line.match(/^1\.\s+Elena/) || line.match(/^1\.\s+Rachel/) || line.match(/Rachel làm nghề gì/) || line.match(/^1\.\s/))) {
            // Is it a vietnamese question? We can check if line has vietnamese characters
            if (line.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i)) {
                mode = 'vnQ';
            }
        }
        
        if (mode === 'enQ') enQBlock.push(line);
        if (mode === 'vnQ') vnQBlock.push(line);
        if (mode === 'enTrans') enTransBlock.push(line);
        if (mode === 'vnTrans') vnTransBlock.push(line);
    }
    
    if (enQBlock.length > 0) {
        processBlocks(enQBlock, vnQBlock, enTransBlock, vnTransBlock, questions);
    }
    
    function processBlocks(enQs, vnQs, enTr, vnTr, outQuestions) {
        // Parse English Questions
        let parsedEnQs = [];
        let curr = null;
        for (let l of enQs) {
            let mOpt = l.match(optRe);
            let checkCorrect = l.includes('✅');
            if (mOpt) {
                if (!curr) continue;
                curr.options.push({id: mOpt[1], text: cleanText(mOpt[2])});
                if (checkCorrect) curr.correctAnswer = mOpt[1];
            } else {
                let mQ = l.match(qRe);
                if (mQ || l.match(/^\d+\./)) {
                    if (curr) parsedEnQs.push(curr);
                    curr = { text: cleanText(l), options: [], correctAnswer: '' };
                    if (checkCorrect) curr.text = curr.text.replace('✅', '').trim();
                }
            }
        }
        if (curr) parsedEnQs.push(curr);
        
        // Parse Vietnamese Questions
        let parsedVnQs = [];
        curr = null;
        for (let l of vnQs) {
            let mOpt = l.match(optRe) || l.match(/^(✅\s*[A-D]|[A-D]\s*✅)\.\s*(.*)/) || l.match(/^(✅\s*[A-D]|[A-D])\s+(.*)/); // Try to match "✅ B. Họa sĩ"
            
            // more robust option parsing
            let mOpt2 = l.replace('✅', '').trim().match(/^([A-D])\.\s*(.*)/);
            
            let checkCorrect = l.includes('✅');
            if (mOpt2) {
                if (!curr) continue;
                curr.options.push({id: mOpt2[1], text: cleanText(mOpt2[2])});
                if (checkCorrect && parsedEnQs[parsedVnQs.length]) {
                    // update correct answer if it was missed in EN
                    parsedEnQs[parsedVnQs.length].correctAnswer = mOpt2[1];
                }
            } else {
                let mQ = l.match(qRe);
                if (mQ || l.match(/^\d+\./) || l.match(/^•/)) {
                    if (curr) parsedVnQs.push(curr);
                    curr = { text: cleanText(l), options: [] };
                }
            }
        }
        if (curr) parsedVnQs.push(curr);
        
        let transENStr = enTr.join(' ').replace(/"/g, '\\"');
        let transVNStr = vnTr.join(' ').replace(/"/g, '\\"');
        
        for (let i = 0; i < parsedEnQs.length; i++) {
            let eq = parsedEnQs[i];
            let vq = parsedVnQs[i] || {text: '', options: []};
            
            let opts = [];
            for (let j = 0; j < 4; j++) {
                let eid = eq.options[j] ? eq.options[j].id : String.fromCharCode(65+j);
                let etxt = eq.options[j] ? eq.options[j].text : "";
                let vtxt = vq.options[j] ? vq.options[j].text : "";
                opts.push(`{ id: '${eid}', textEN: "${etxt.replace(/"/g, '\\"')}", textVN: "${vtxt.replace(/"/g, '\\"')}" }`);
            }
            
            outQuestions.push(`
      {
        id: ${outQuestions.length + 1},
        questionEN: "${eq.text.replace(/"/g, '\\"')}",
        questionVN: "${vq.text.replace(/"/g, '\\"')}",
        options: [
          ${opts.join(',\n          ')}
        ],
        correctAnswer: '${eq.correctAnswer || 'A'}',
        transcriptEN: "${transENStr}",
        transcriptVN: "${transVNStr}"
      }`);
        }
    }
    
    return `
  ${dayIndex}: {
    title: "ENGLISH WITH MISS NGUYET",
    audioSrc: [
      { title: "${audios[0].title}", src: "${audios[0].src}" },
      { title: "${audios[1].title}", src: "${audios[1].src}" }
    ],
    questions: [${questions.join(',')}
    ]
  }`;
}

const day4 = parseFile('scripts_day04.txt', 4, [
  {title: "PRACTICE 01", src: "day04_practice01.mp3"},
  {title: "PRACTICE 02", src: "day04_practice02.mp3"}
]);

const day5 = parseFile('scripts_day05.txt', 5, [
  {title: "PRACTICE 03", src: "day05_practice03.mp3"},
  {title: "PRACTICE 04", src: "day05_practice04.mp3"}
]);

const day6 = parseFile('scripts_day06.txt', 6, [
  {title: "PRACTICE 05", src: "day06_practice05.mp3"},
  {title: "PRACTICE 06", src: "day06_practice06.mp3"}
]);

let dataJs = fs.readFileSync('data.js', 'utf-8');
dataJs = dataJs.replace('  }\n};', '  },' + day4 + ',' + day5 + ',' + day6 + '\n};');
fs.writeFileSync('data.js', dataJs);
console.log("Done");
