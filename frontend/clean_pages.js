const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Clean duplicated text-black dark:text-black... 
  content = content.replace(/(text-black\s+)+/g, 'text-black ');
  content = content.replace(/(dark:text-white\s*)+/g, 'dark:text-white ');
  content = content.replace(/(dark:text-black\s*)+/g, ''); 
  content = content.replace(/text-black\s+dark:text-white/g, 'text-black dark:text-white');
  
  // Clean duplicated gray
  content = content.replace(/(text-gray-500\s+)+/g, 'text-gray-500 ');
  content = content.replace(/(dark:text-gray-500\s*)+/g, ''); 
  
  // Clean duplicated background
  content = content.replace(/(bg-white\s+)+/g, 'bg-white ');
  content = content.replace(/(dark:bg-white\/5\s*)+/g, 'dark:bg-white/5 ');
  content = content.replace(/(dark:bg-white\s*)+/g, '');
  content = content.replace(/(bg-zinc-950\s+)+/g, 'bg-zinc-950 ');
  content = content.replace(/(dark:bg-zinc-950\/80\s*)+/g, 'dark:bg-zinc-950/80 ');
  
  // Clean duplicated borders
  content = content.replace(/(border-black\s+)+/g, 'border-black ');
  content = content.replace(/(dark:border-white\/10\s*)+/g, 'dark:border-white/10 ');
  content = content.replace(/(border\s+)+/g, 'border ');

  // Clean duplicated shadows
  content = content.replace(/(shadow-\[2px_2px_0_0_black\]\s+)+/g, 'shadow-[2px_2px_0_0_black] ');
  content = content.replace(/(dark:shadow-none\s*)+/g, 'dark:shadow-none ');
  content = content.replace(/(transition-colors\s+)+/g, 'transition-colors ');
  content = content.replace(/(duration-300\s+)+/g, 'duration-300 ');

  // Multiple spaces to single space
  content = content.replace(/\s+/g, ' ');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned ${file}`);
  }
});
