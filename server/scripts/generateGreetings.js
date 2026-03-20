import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core greeting parts
const bases = ['hi', 'hello', 'hey', 'heyy', 'hii', 'yo', 'sup', 'howdy', 'hlo', 'greetings', 'salutations'];
const suffixes = ['', ' there', ' bro', ' friend', ' buddy', ' man', ' mate', ' dude', ' yall', ' everyone', ' folks'];
const times = ['', ' good morning', ' morning', ' good afternoon', ' afternoon', ' good evening', ' evening', ' good night', ' night'];
const punctuation = ['', '!', '.', '!!', '...', ' :)', ' :D'];

const questions = [
  'how are you', 'how r u', 'how r you', 'how are u', 'how do you do', 'whats up', 'whats going on', 
  'hows it going', 'how is everything', 'what are you doing'
];

const festival = [
  'happy birthday', 'merry christmas', 'happy new year', 'happy diwali', 'happy thanksgiving', 
  'happy halloween', 'happy easter', 'happy holidays'
];

// Clean normalization function
const normalize = (str) => {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

const greetingsSet = new Set();

// Generate Cartesian Product of Base + Suffix + Time
for (const base of bases) {
  for (const suffix of suffixes) {
    for (const time of times) {
       for (const punc of punctuation) {
          const combo = `${base}${suffix}${time}${punc}`;
          const norm = normalize(combo);
          if (norm.length > 0) greetingsSet.add(norm);

          // Reverse order: time + base + suffix
          if (time !== '') {
            const combo2 = `${time.trim()} ${base}${suffix}${punc}`;
            const norm2 = normalize(combo2);
            if (norm2.length > 0) greetingsSet.add(norm2);
          }
       }
    }
  }
}

// Add common questions and standalone times
questions.forEach(q => {
  greetingsSet.add(normalize(q));
  bases.forEach(b => greetingsSet.add(normalize(b + ' ' + q)));
});

festival.forEach(f => {
  greetingsSet.add(normalize(f));
  bases.forEach(b => greetingsSet.add(normalize(b + ' ' + f)));
});

const standalones = ['morning', 'good morning', 'afternoon', 'good afternoon', 'evening', 'good evening', 'night', 'good night'];
standalones.forEach(s => greetingsSet.add(normalize(s)));

// Add some typical typos
['hie', 'hy', 'helo', 'heloo', 'hallooo', 'hola', 'bonjour'].forEach(t => greetingsSet.add(normalize(t)));

// Save to JSON
const outputArray = Array.from(greetingsSet);
const dirPath = path.join(__dirname, '../data');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const outPath = path.join(dirPath, 'greetings.json');
fs.writeFileSync(outPath, JSON.stringify(outputArray, null, 2));

console.log(`Successfully generated ${outputArray.length} unique greeting permutations.`);
console.log(`Saved to ${outPath}`);
