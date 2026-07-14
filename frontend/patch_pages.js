import fs from 'fs';
import path from 'path';

function patchFile(filepath) {
    let content = fs.readFileSync(filepath, 'utf8');

    // Fix backgrounds that are "bg-white/5" etc to be "bg-white dark:bg-white/5" and add borders in light mode
    // Actually, for a sketchbook style, let's make all cards white with black border in light mode, and dark with faint border in dark mode.
    content = content.replace(/className="([^"]*)bg-white\/5([^"]*)"/g, 'className="$1bg-white dark:bg-white/5 border border-black dark:border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-none transition-colors duration-300$2"');
    
    // Fix pure text-white -> text-black dark:text-white
    // But be careful not to replace text-white/50 etc if it's not pure text-white. We can use regex \btext-white\b
    content = content.replace(/\btext-white\b/g, 'text-black dark:text-white');
    
    // Fix text-[#aaaaaa] to be slightly darker in light mode text-gray-500 dark:text-[#aaaaaa]
    content = content.replace(/text-\[#aaaaaa\]/g, 'text-gray-500 dark:text-[#aaaaaa]');
    
    // Fix lines in recharts in LogAnalytics and Dashboard from hardcoded light colors
    // LogAnalytics is done if we don't mess it up, but recharts is tricky inline without theme context. 
    // We'll just leave recharts colors for now or assume they are okay, user just said "text are barely visible".

    fs.writeFileSync(filepath, content);
}

patchFile('/home/krisss/LogGuard/frontend/src/pages/Dashboard.tsx');
patchFile('/home/krisss/LogGuard/frontend/src/pages/LogAnalytics.tsx');
patchFile('/home/krisss/LogGuard/frontend/src/pages/RootCauseAnalysis.tsx');

