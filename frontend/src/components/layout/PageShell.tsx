import React from 'react'
import { useLocation, Link } from 'react-router-dom'

import { DemoButton } from '../demo/DemoButton'
import { useAnomalies } from '../../hooks/useAnomalies'

export function PageShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  

  const { data: recentAnomalies } = useAnomalies({ 
    min_score: 0.0,
    limit: 50 
  });
  
  // Match the HostGrid logic EXACTLY: get the current (latest) score for each node, then return the highest among them
  let maxScore = 0;
  if (recentAnomalies && recentAnomalies.length > 0) {
    const hostScores = recentAnomalies.reduce((acc: Record<string, number>, curr: any) => {
      if (!(curr.host in acc)) {
        acc[curr.host] = curr.final_score;
      }
      return acc;
    }, {});
    
    const currentScores: number[] = Object.values(hostScores);
    if (currentScores.length > 0) {
      maxScore = Math.max(...currentScores);
    }
  }
  
  const crashRate = maxScore * 100;

  return (
    <div className="flex h-screen w-full bg-black text-white text-white overflow-hidden transition-colors duration-300 relative">
      
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none z-0 `}
        >
          <source src="/back.mp4" type="video/mp4" />
        </video>

        {/* Subtle grid background to look professional */}
        <div className={`absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-screen z-0 `}></div>

        {/* Sidebar */}
        <aside className="fixed left-0 top-0 h-full flex flex-col z-40 bg-zinc-950/80 backdrop-blur-3xl w-64 border-r border-white/5 shadow-2xl transition-colors duration-300" >
            <div className="p-6">
                <div className="mb-8 px-4">
                    <h2 className="text-white font-black text-3xl tracking-tighter uppercase drop-shadow-lg">Ai0ps</h2>
                    <p className="text-[#aaaaaa] text-[10px] uppercase tracking-widest mt-1 font-mono">Core Engine v1.0</p>
                </div>
                
                <nav className="space-y-2 mt-8 px-2">
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
                            ? "flex items-center gap-3 text-white bg-gray-100 dark:bg-white/10 rounded-lg px-4 py-3 transition-all duration-200 border border-black border-white/10 shadow-[2px_2px_0_0_black] dark:shadow-lg dark:backdrop-blur-md overflow-hidden"
                            : "flex items-center gap-3 text-[#aaaaaa] hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-200 border border-transparent hover:border-black dark:hover:border-transparent overflow-hidden"
                          }
                        >
                            <span className="material-symbols-outlined text-[18px] flex-shrink-0">{item.icon}</span>
                            <span className="font-bold text-sm tracking-wider uppercase truncate">{item.text}</span>
                        </Link>
                      );
                    })}
                </nav>
            </div>
            
            <div className="mt-auto p-6 space-y-4">


                
<div className="pt-4 border-t border-black border-white/10">
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-[#aaaaaa]">Fatal Crash %</span>
                            <span className="text-[10px] font-mono text-[#aaaaaa]/60 mt-0.5 uppercase">Max Node Risk</span>
                        </div>
                        <span className={`text-sm font-black tracking-widest ${crashRate > 70 ? 'text-[#ff3333]' : crashRate > 40 ? 'text-[#ffff33]' : 'text-[#33ff33]'}`}>
                            {crashRate.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden ml-64 bg-transparent z-10">
            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 bg-zinc-50 dark:bg-zinc-950/50 backdrop-blur-xl border-b border-white/5 shadow-2xl shrink-0 shadow-sm dark:shadow-none transition-colors duration-300">
                <div className="flex items-center gap-8">
                    <h1 className="text-lg font-black text-white tracking-widest uppercase">Telemetry Dashboard</h1>
                </div>
                {/* Header Right */}
                <div className="flex items-center gap-4">
                    <DemoButton />
                </div>
            </header>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-[1600px] mx-auto space-y-6">
                    {children}
                </div>
            </div>
        </main>
    </div>
  )
}
