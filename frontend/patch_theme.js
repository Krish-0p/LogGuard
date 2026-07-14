import fs from 'fs';

let pageShell = fs.readFileSync('src/components/layout/PageShell.tsx', 'utf8');

// Remove import { useTheme }
pageShell = pageShell.replace("import { useTheme } from '../../context/ThemeContext'", "");

// Remove const { theme, toggleTheme }
pageShell = pageShell.replace("const { theme, toggleTheme } = useTheme();", "");

// Remove light mode classes
pageShell = pageShell.replace("bg-white text-black dark:bg-black dark:text-white", "bg-black text-white");
// Ensure back video opacity isn't hidden in light mode
pageShell = pageShell.replace("${theme === \"light\" ? \"hidden\" : \"\"}", "");
pageShell = pageShell.replace("${theme === \"light\" ? \"hidden\" : \"\"}", "");

// Replace the button toggle code entirely
const buttonRegex = /<button onClick=\{toggleTheme\}.*?<\/button>/mgs;
pageShell = pageShell.replace(buttonRegex, "");

// Remove any lingering theme references inside classNames
pageShell = pageShell.replace(/dark:border-white\/10/g, "border-white/10");
pageShell = pageShell.replace(/border-black dark:border-white\/10/g, "border-white/10");
pageShell = pageShell.replace(/text-black\/60 dark:text-\[\#aaaaaa\]/g, "text-[#aaaaaa]");

fs.writeFileSync('src/components/layout/PageShell.tsx', pageShell);
