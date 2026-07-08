const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const code = fs.readFileSync('/Users/nguyetpham/Desktop/WEBSITE/luyen-nghe-chong-diec/web-app/data.js', 'utf8');
const evalCode = code.replace('const daysData', 'var daysData');
eval(evalCode);

const dom = new JSDOM(`<!DOCTYPE html><div id="quiz-container"></div>`);
const document = dom.window.document;

function formatTranscript(text) {
    if (!text) return "";
    const regex = /\b(M|W|Nam|Nữ|Rachel|Man)\s*:\s*/g;
    let formatted = text.replace(regex, (match, speaker) => {
        return `<br><strong>${speaker}:</strong> `;
    });
    formatted = formatted.trim();
    if (formatted.startsWith('<br>')) {
        formatted = formatted.substring(4);
    }
    return formatted;
}

const quizContainer = document.getElementById('quiz-container');
const practice = daysData[4].practices[1];
const practiceId = 'practice-1';

const firstQ = practice.questions[0];
console.log('Testing regex for Day 4 P2:', /\(\s*1\s*\)/.test(firstQ.transcriptEN));

try {
    if (firstQ && firstQ.transcriptEN && /\(\s*1\s*\)/.test(firstQ.transcriptEN)) {
        const fullTranscriptContainer = document.createElement('div');
        fullTranscriptContainer.className = 'full-transcript-section';
        fullTranscriptContainer.id = `full-trans-section-${practiceId}`;
        fullTranscriptContainer.innerHTML = `
            <button>Toggle</button>
            <div>
                <p>${formatTranscript(firstQ.transcriptEN)}</p>
            </div>
        `;
        quizContainer.appendChild(fullTranscriptContainer);
        console.log('Appended successfully! HTML length:', quizContainer.innerHTML.length);
    }
} catch (e) {
    console.error('Error during append:', e);
}
