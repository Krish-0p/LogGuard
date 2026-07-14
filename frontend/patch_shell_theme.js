import fs from 'fs';

let content = fs.readFileSync('/home/krisss/LogGuard/frontend/src/components/layout/PageShell.tsx', 'utf8');

if (!content.includes('useTheme')) {
    content = content.replace("import { useLocation, Link } from 'react-router-dom'", "import { useLocation, Link } from 'react-router-dom'\nimport { useTheme } from '../../context/ThemeContext'");
}

if (!content.includes('const { theme, toggleTheme } = useTheme();')) {
    content = content.replace('const location = useLocation();', 'const location = useLocation();\n  const { theme, toggleTheme } = useTheme();');
}

// Add the button above Fatal Crash % inside the mt-auto div
const mtAutoRegex = /<div className="mt-auto p-6 space-y-4">/;
content = content.replace(mtAutoRegex, `<div className="mt-auto p-6 space-y-4">
                <button onClick={toggleTheme} className="flex items-center gap-3 text-[#aaaaaa] hover:text-black dark:hover:text-white transition-colors duration-200">
                  <span className="material-symbols-outlined text-[18px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                  <span className="font-bold text-sm tracking-wider uppercase truncate">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>`);

// Fix background classes
content = content.replace('bg-black text-white overflow-hidden', 'bg-gray-50 text-zinc-900 dark:bg-black dark:text-white overflow-hidden transition-colors duration-300');
content = content.replace('bg-zinc-950/80 backdrop-blur-3xl w-64', 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl w-64 transition-colors duration-300');
content = content.replace('text-white font-black', 'text-black dark:text-white font-black');

fs.writeFileSync('/home/krisss/LogGuard/frontend/src/components/layout/PageShell.tsx', content);
