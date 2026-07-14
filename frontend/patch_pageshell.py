with open("frontend/src/components/layout/PageShell.tsx", "r") as f:
    text = f.read()

# Let's undo my broken sed and do it properly. 
text = text.replace(
'''                    <a className="flex items-center gap-3 text-[#aaaaaa] hover:text-white hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-200 border border-transparent overflow-hidden" href="/rca">
                    </a>
                    <a className="flex items-center gap-3 text-[#aaaaaa] hover:text-white hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-200 border border-transparent overflow-hidden" href="/log-analytics">
                        <span className="material-symbols-outlined text-[18px] flex-shrink-0">upload_file</span>
                        <span className="font-bold text-sm tracking-wider uppercase truncate">Upload Log</span>
                        <span className="material-symbols-outlined text-[18px] flex-shrink-0">troubleshoot</span>
                        <span className="font-bold text-sm tracking-wider uppercase truncate">Deep RCA</span>
                    </a>''',

'''                    <a className="flex items-center gap-3 text-[#aaaaaa] hover:text-white hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-200 border border-transparent overflow-hidden" href="/rca">
                        <span className="material-symbols-outlined text-[18px] flex-shrink-0">troubleshoot</span>
                        <span className="font-bold text-sm tracking-wider uppercase truncate">Deep RCA</span>
                    </a>
                    <a className="flex items-center gap-3 text-[#aaaaaa] hover:text-white hover:bg-white/5 rounded-lg px-4 py-3 transition-all duration-200 border border-transparent overflow-hidden" href="/log-analytics">
                        <span className="material-symbols-outlined text-[18px] flex-shrink-0">upload_file</span>
                        <span className="font-bold text-sm tracking-wider uppercase truncate">Upload Log</span>
                    </a>'''
)

with open("frontend/src/components/layout/PageShell.tsx", "w") as f:
    f.write(text)
