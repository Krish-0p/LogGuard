import fs from 'fs';
let content = fs.readFileSync('/home/krisss/LogGuard/frontend/src/components/layout/PageShell.tsx', 'utf8');

// Strip out light mode fallbacks mapped to dark variants
content = content.replace(/text-black dark:text-white/g, 'text-white');
content = content.replace(/bg-zinc-50 dark:bg-zinc-950\/80/g, 'bg-zinc-950/80 backdrop-blur-3xl');
content = content.replace(/border-\[\#e0e0e0\] dark:border-white\/5/g, 'border-white/5 shadow-2xl');
content = content.replace(/text-black\/60 dark:text-\[\#aaaaaa\]/g, 'text-[#aaaaaa]');
content = content.replace(/border-black dark:border-white\/10/g, 'border-white/10');
content = content.replace(/bg-white hover:bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white\/10/g, 'bg-zinc-900 hover:bg-zinc-800 border border-white/10');
content = content.replace(/bg-white dark:bg-black/g, 'bg-black text-white');
content = content.replace(/bg-zinc-100 dark:bg-zinc-900/g, 'bg-zinc-900');

fs.writeFileSync('/home/krisss/LogGuard/frontend/src/components/layout/PageShell.tsx', content);
