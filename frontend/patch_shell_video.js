import fs from 'fs';

let content = fs.readFileSync('/home/krisss/LogGuard/frontend/src/components/layout/PageShell.tsx', 'utf8');

// The twin toggle buttons are around line 83
// We will replace them completely.
const contentBefore = content.split('<div className="mt-auto p-6 space-y-4">')[0];
const contentAfterRaw = content.split('<div className="mt-auto p-6 space-y-4">')[1];

const cleanAfter = contentAfterRaw.replace(/<button[\s\S]*?<\/button>\s*<button[\s\S]*?<\/button>\s*/, 
  `<button onClick={toggleTheme} className="flex items-center gap-3 text-black/60 dark:text-[#aaaaaa] hover:text-black dark:hover:text-white transition-colors duration-200 mb-4">
    <span className="material-symbols-outlined text-[18px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
    <span className="font-bold text-sm tracking-wider uppercase truncate">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
  </button>\n`
);

let newContent = contentBefore + '<div className="mt-auto p-6 space-y-4">\n' + cleanAfter;

// 1. Hide video & grid when light mode
newContent = newContent.replace('className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0"', 
  'className={`absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0 ${theme === "light" ? "hidden" : ""}`}');

newContent = newContent.replace('className="absolute inset-0 bg-[url(\'https://transparenttextures.com/patterns/cubes.png\')] opacity-[0.03] pointer-events-none mix-blend-screen z-0"', 
  'className={`absolute inset-0 bg-[url(\'https://transparenttextures.com/patterns/cubes.png\')] opacity-[0.03] pointer-events-none mix-blend-screen z-0 ${theme === "light" ? "hidden" : ""}`}');

// 2. White background and black borders for light mode
// Sidebar
newContent = newContent.replace('bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl w-64 transition-colors duration-300 border-r border-white/5 shadow-2xl', 
  'bg-white dark:bg-zinc-950/80 backdrop-blur-none dark:backdrop-blur-3xl w-64 transition-colors duration-300 border-r border-black dark:border-white/5 shadow-[2px_0_0_0_black] dark:shadow-2xl');

// Top Header
newContent = newContent.replace('h-20 flex items-center justify-between px-8 bg-zinc-950/50 backdrop-blur-xl border-b border-white/5 shrink-0 shadow-lg', 
  'h-20 flex items-center justify-between px-8 bg-white dark:bg-zinc-950/50 backdrop-blur-none dark:backdrop-blur-xl border-b border-black dark:border-white/5 shrink-0 shadow-[0_2px_0_0_black] dark:shadow-lg');

// Ensure text is black in light mode
newContent = newContent.replace(/text-white font-black/g, 'text-black dark:text-white font-black');

// Fix border at the bottom
newContent = newContent.replace('pt-4 border-t border-white/10', 'pt-4 border-t border-black dark:border-white/10');

// Fix links transparency and look in light mode
newContent = newContent.replace('text-white bg-white/10 rounded-lg px-4 py-3 transition-all duration-200 border border-white/10 shadow-lg backdrop-blur-md overflow-hidden', 
  'text-black dark:text-white bg-gray-100 dark:bg-white/10 rounded-lg px-4 py-3 transition-all duration-200 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-lg dark:backdrop-blur-md overflow-hidden');

newContent = newContent.replace('text-[#aaaaaa] hover:text-white hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-200 border border-transparent overflow-hidden', 
  'text-black/60 dark:text-[#aaaaaa] hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-200 border border-transparent hover:border-black dark:hover:border-transparent overflow-hidden');

// "Telemetry Dashboard" Text
newContent = newContent.replace('text-white tracking-widest uppercase', 'text-black dark:text-white tracking-widest uppercase');


fs.writeFileSync('/home/krisss/LogGuard/frontend/src/components/layout/PageShell.tsx', newContent);
