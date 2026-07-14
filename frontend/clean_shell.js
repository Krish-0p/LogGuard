import fs from 'fs';
let content = fs.readFileSync('/home/krisss/LogGuard/frontend/src/components/layout/PageShell.tsx', 'utf8');

content = content.replace(/<aside className="[^"]+"/, '<aside className="fixed left-0 top-0 h-full flex flex-col z-40 bg-zinc-50 dark:bg-zinc-950/80 w-64 border-r border-[#e0e0e0] dark:border-white/5 transition-colors duration-300">');
content = content.replace(/<h2 className="[^"]+">LogGuard<\/h2>/, '<h2 className="text-black dark:text-white font-black text-3xl tracking-tighter uppercase drop-shadow-lg">LogGuard</h2>');
content = content.replace(/<div className="flex h-screen w-full[^"]+"/, '<div className="flex h-screen w-full bg-white dark:bg-black text-black dark:text-white overflow-hidden transition-colors duration-300 relative"');
content = content.replace(/<header className="[^"]+"/, '<header className="h-20 flex items-center justify-between px-8 bg-zinc-50 dark:bg-zinc-950/50 backdrop-blur-xl border-b border-[#e0e0e0] dark:border-white/5 shrink-0 shadow-sm dark:shadow-none transition-colors duration-300"');
content = content.replace(/<h1 className="[^"]+">Telemetry Dashboard<\/h1>/, '<h1 className="text-lg font-black text-black dark:text-white tracking-widest uppercase">Telemetry Dashboard</h1>');

fs.writeFileSync('/home/krisss/LogGuard/frontend/src/components/layout/PageShell.tsx', content);
