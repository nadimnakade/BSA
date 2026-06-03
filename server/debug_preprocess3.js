const fs=require('fs');
const{preprocessCibilText}=require('./cibil_parser');
const text=fs.readFileSync('xavier_text_raw.txt','utf-8');
const pre=preprocessCibilText(text);
console.log('Preprocessed length:', pre.length);
console.log('Has Mobile Phone:', pre.includes('Mobile Phone'));
console.log('Has 9920117216:', pre.includes('9920117216'));
console.log('Has 8879367977:', pre.includes('8879367977'));

// Where is the contact section?
const idx = pre.indexOf('Contact');
console.log('Contact idx:', idx);
if (idx > 0) console.log('Context:', JSON.stringify(pre.slice(idx, idx+500)));
