import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { generateStaticExport } from '../renderer/html/htmlRenderer';
import { Copy, Check, Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const ExportPanel: React.FC = () => {
  const ast = useWorkspaceStore((state) => state.ast);
  const code = useWorkspaceStore((state) => state.code);
  const runtimeState = useWorkspaceStore((state) => state.runtimeState);

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'ast'>('html');
  const [copied, setCopied] = useState(false);

  const { html, css } = generateStaticExport(ast, runtimeState);
  const astJson = ast ? JSON.stringify(ast, null, 2) : '';

  const getActiveCode = () => {
    switch (activeTab) {
      case 'css':
        return css;
      case 'ast':
        return astJson;
      default:
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compose Studio Export</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${html}
</body>
</html>`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    
    zip.file('compose.kt', code);
    zip.file('style.css', css);
    zip.file('ast.json', astJson);
    
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compose Studio Export</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${html}
</body>
</html>`;
    
    zip.file('index.html', fullHtml);

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'composeweb-project.zip');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1f22]">
      {/* Sub Header / Control bar */}
      <div className="px-3 py-1.5 bg-[#2b2d30]/30 border-b border-[#2b2d30] flex items-center justify-between select-none shrink-0">
        <div className="flex items-center space-x-1.5">
          <button
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              activeTab === 'html' ? 'bg-[#3574f0] text-white' : 'text-[#9da5b4] hover:text-[#dfe1e5] hover:bg-[#2b2d30]/40'
            }`}
            onClick={() => setActiveTab('html')}
          >
            HTML Template
          </button>
          <button
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              activeTab === 'css' ? 'bg-[#3574f0] text-white' : 'text-[#9da5b4] hover:text-[#dfe1e5] hover:bg-[#2b2d30]/40'
            }`}
            onClick={() => setActiveTab('css')}
          >
            CSS Sheet
          </button>
          <button
            className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
              activeTab === 'ast' ? 'bg-[#3574f0] text-white' : 'text-[#9da5b4] hover:text-[#dfe1e5] hover:bg-[#2b2d30]/40'
            }`}
            onClick={() => setActiveTab('ast')}
          >
            JSON AST
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* Copy */}
          <button
            className="p-1 bg-[#2b2d30] hover:bg-[#35373c] text-[#dfe1e5] rounded transition-colors flex items-center text-[10px] space-x-1 font-sans"
            onClick={handleCopy}
          >
            {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download ZIP */}
          <button
            className="p-1 bg-[#3574f0] hover:bg-[#4c84f2] text-white rounded transition-colors flex items-center text-[10px] space-x-1 font-sans font-medium"
            onClick={handleDownloadZip}
          >
            <Download className="w-3 h-3" />
            <span>Download ZIP</span>
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 bg-[#18191b] p-3 font-mono text-[11px] overflow-auto text-[#dfe1e5] max-h-[170px]">
        <pre className="whitespace-pre">{getActiveCode() || 'No export content.'}</pre>
      </div>
    </div>
  );
};
