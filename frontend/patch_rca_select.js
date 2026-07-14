import fs from 'fs';

let content = fs.readFileSync('/home/krisss/LogGuard/frontend/src/pages/RootCauseAnalysis.tsx', 'utf8');

const selectRegex = /(<select[\s\S]*?>)([\s\S]*?)(<\/select>)/g;
content = content.replace(selectRegex, (match, openTag, options, closeTag) => {
    // Add bg-zinc-900 to option tags to ensure it's not transparent/white
    const newOptions = options.replace(/<option /g, '<option className="bg-zinc-950 text-white" ');
    return openTag + newOptions + closeTag;
});

fs.writeFileSync('/home/krisss/LogGuard/frontend/src/pages/RootCauseAnalysis.tsx', content);
