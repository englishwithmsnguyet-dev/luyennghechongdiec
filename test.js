const fs = require('fs');

const code = fs.readFileSync('/Users/nguyetpham/Desktop/WEBSITE/luyen-nghe-chong-diec/web-app/data.js', 'utf8');

// We need to evaluate data.js, but since it has 'const daysData', we can just replace 'const' with 'var'
const evalCode = code.replace('const daysData', 'var daysData');
eval(evalCode);

const day4 = daysData[4];
const p2 = day4.practices[1];
const firstQ = p2.questions[0];

const hasMarkers = /\(\s*1\s*\)/.test(firstQ.transcriptEN);
console.log('Q5 ID:', firstQ.id);
console.log('Has markers:', hasMarkers);
