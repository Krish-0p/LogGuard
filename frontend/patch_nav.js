import fs from 'fs';

let content = fs.readFileSync('src/components/layout/PageShell.tsx', 'utf8');

// Insert useLocation import
if (!content.includes('useLocation')) {
    content = content.replace("import React from 'react'", "import React from 'react'\nimport { useLocation, Link } from 'react-router-dom'");
}

// Ensure the PageShell function grabs the location
if (!content.includes('const location = useLocation();')) {
    content = content.replace('export function PageShell({ children }: { children: React.ReactNode }) {', 'export function PageShell({ children }: { children: React.ReactNode }) {\n  const location = useLocation();\n');
}

// Replace the nav block
const oldNavBlockMatches = content.match(/<nav[^>]*>[\s\S]*?<\/nav>/);

if (oldNavBlockMatches) {
    const oldNavBlock = oldNavBlockMatches[0];
    
    const newNavBlock = `<nav className="space-y-2 mt-8 px-2">
                    {[
                      { path: '/dashboard', icon: 'dashboard', text: 'Dashboard' },
                      { path: '/rca', icon: 'troubleshoot', text: 'Deep RCA' },
                      { path: '/log-analytics', icon: 'upload_file', text: 'Upload Log' },
                    ].map((item) => {
                      const isActive = location.pathname.startsWith(item.path);
                      return (
                        <Link 
                          key={item.path}
                          to={item.path} 
                          className={isActive 
                            ? "flex items-center gap-3 text-white bg-white/10 rounded-lg px-4 py-3 transition-all duration-200 border border-white/10 shadow-lg backdrop-blur-md overflow-hidden"
                            : "flex items-center gap-3 text-[#aaaaaa] hover:text-white hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-200 border border-transparent overflow-hidden"
                          }
                        >
                            <span className="material-symbols-outlined text-[18px] flex-shrink-0">{item.icon}</span>
                            <span className="font-bold text-sm tracking-wider uppercase truncate">{item.text}</span>
                        </Link>
                      );
                    })}
                </nav>`;
    content = content.replace(oldNavBlock, newNavBlock);
}

fs.writeFileSync('src/components/layout/PageShell.tsx', content);
