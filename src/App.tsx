import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from './store/workspaceStore';
import { MonacoEditor } from './editor/MonacoEditor';
import { ComponentTree } from './components/ComponentTree';
import { ConsolePanel } from './components/ConsolePanel';
import { LivePreview } from './preview/LivePreview';
import { Code2, Monitor, Layout, FileText, ChevronLeft, ChevronRight, Menu, Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateStaticExport } from './renderer/html/htmlRenderer';

const App: React.FC = () => {
  const diagnostics = useWorkspaceStore((state) => state.diagnostics);
  const ast = useWorkspaceStore((state) => state.ast);
  const code = useWorkspaceStore((state) => state.code);
  const runtimeState = useWorkspaceStore((state) => state.runtimeState);
  
  // Layout states: matching Android Studio options (Code | Split | Design)
  const [layoutMode, setLayoutMode] = useState<'code' | 'split' | 'design'>('split');
  const [showExplorer, setShowExplorer] = useState(true);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  
  // Compilation notifications state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'warning'>('success');

  const errorsCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningsCount = diagnostics.filter((d) => d.severity === 'warning').length;

  useEffect(() => {
    if (ast) {
      if (errorsCount > 0) {
        setNotificationType('error');
      } else if (warningsCount > 0) {
        setNotificationType('warning');
      } else {
        setNotificationType('success');
      }
      setShowNotification(true);
      
      // Auto-dismiss success build after 4 seconds
      if (errorsCount === 0) {
        const timer = setTimeout(() => {
          setShowNotification(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [errorsCount, warningsCount, ast]);

  const handleDownloadZip = async () => {
    try {
      const { html, css } = generateStaticExport(ast, runtimeState);
      const astJson = ast ? JSON.stringify(ast, null, 2) : '';
      const zip = new JSZip();
      
      zip.file('compose.kt', code);
      zip.file('style.css', css);
      zip.file('ast.json', astJson);
      
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ComposeWeb Studio Export</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${html}
</body>
</html>`;
      
      zip.file('index.html', fullHtml);

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'composeweb-project.zip');
    } catch (e) {
      console.error('Failed to export ZIP', e);
    }
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#1e1f22] text-[#dfe1e5] font-sans overflow-hidden relative">
      {/* Android Studio Top Status Bar */}
      <header className="h-10 bg-[#1e1f22] border-b border-[#2b2d30] flex items-center justify-between px-3 shrink-0 select-none">
        <div className="flex items-center space-x-2.5">
          {/* Mock AS Icon */}
          <div className="flex items-center justify-center w-5 h-5 bg-[#3c3f41] rounded border border-[#555]">
            <span className="text-[10px] font-bold text-[#3574f0]">AS</span>
          </div>
          <span className="text-xs font-semibold text-[#dfe1e5]">ComposeWeb Studio</span>
          <span className="text-[10px] text-[#9da5b4] font-mono">MainActivity.kt</span>
        </div>

        {/* Top bar actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setNotificationType(errorsCount > 0 ? 'error' : 'success');
              setShowNotification(true);
            }}
            className="px-2.5 py-1 bg-[#2b2d30] hover:bg-[#3c3f41] text-[#dfe1e5] border border-[#3c3f41] text-[10px] rounded font-medium transition-colors flex items-center space-x-1"
            title="Build Project (Hammer)"
          >
            <span className="text-green-500 font-bold mr-0.5">▶</span>
            <span>Build</span>
          </button>

          <button
            onClick={handleDownloadZip}
            className="px-2.5 py-1 bg-[#3574f0] hover:bg-[#4c84f2] text-white text-[10px] rounded font-medium transition-colors flex items-center space-x-1"
            title="Download full project folder as ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export ZIP</span>
          </button>
        </div>
      </header>

      {/* Main Studio Frame */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* IntelliJ Left Tool Stripe */}
        <div className="w-8 bg-[#1e1f22] border-r border-[#2b2d30] flex flex-col items-center py-2 shrink-0 select-none">
          <button
            className={`w-full py-3 text-center transition-colors flex flex-col items-center justify-center space-y-1 ${
              showExplorer ? 'text-blue-400 bg-[#2b2d30]/50' : 'text-[#9da5b4] hover:text-[#dfe1e5]'
            }`}
            onClick={() => setShowExplorer(!showExplorer)}
            title="Toggle Project Tool Window"
          >
            <Menu className="w-4 h-4 mb-1 rotate-90" />
            <span className="text-[10px] font-semibold tracking-wider uppercase [writing-mode:vertical-lr] rotate-180">
              Project
            </span>
          </button>
        </div>

        {/* Collapsible Left Explorer Panel */}
        {showExplorer && (
          <aside className="w-60 bg-[#1e1f22] border-r border-[#2b2d30] flex flex-col shrink-0 overflow-hidden p-1">
            <ComponentTree />
          </aside>
        )}

        {/* Workspace Splitting Layout */}
        <div className="flex-1 flex overflow-hidden bg-[#1e1f22] p-1.5 gap-1.5">
          
          {/* Left Column: Monaco Code Editor + Console logs (Logcat) */}
          {(layoutMode === 'code' || layoutMode === 'split') && (
            <div className="flex-1 flex flex-col overflow-hidden gap-1.5">
              
              {/* Editor Tabs & View Mode Bar */}
              <div className="h-8 bg-[#1e1f22] border border-[#2b2d30] border-b-0 rounded-t-md flex items-center justify-between px-2 shrink-0 select-none">
                {/* Active Editor Tab */}
                <div className="flex items-center space-x-1 bg-[#1e1f22] border-r border-[#2b2d30] px-3 h-full border-t-2 border-[#3574f0] -mt-px text-xs font-medium text-[#dfe1e5]">
                  <span className="text-orange-500 font-bold mr-1 text-[10px]">K</span>
                  <span>MainActivity.kt</span>
                </div>

                {/* Android Studio Split Mode buttons (Code | Split | Design) */}
                <div className="flex items-center border border-[#2b2d30] rounded overflow-hidden p-0.5 bg-[#2b2d30]">
                  <button
                    className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      layoutMode === 'code' ? 'bg-[#3574f0] text-white rounded-sm' : 'text-[#9da5b4] hover:text-[#dfe1e5]'
                    }`}
                    onClick={() => setLayoutMode('code')}
                  >
                    Code
                  </button>
                  <button
                    className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      layoutMode === 'split' ? 'bg-[#3574f0] text-white rounded-sm' : 'text-[#9da5b4] hover:text-[#dfe1e5]'
                    }`}
                    onClick={() => setLayoutMode('split')}
                  >
                    Split
                  </button>
                  <button
                    className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      (layoutMode as string) === 'design' ? 'bg-[#3574f0] text-white rounded-sm' : 'text-[#9da5b4] hover:text-[#dfe1e5]'
                    }`}
                    onClick={() => setLayoutMode('design')}
                  >
                    Design
                  </button>
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 min-h-[250px] border border-[#2b2d30] border-t-0 rounded-b-md overflow-hidden bg-[#1e1e1e]">
                <MonacoEditor />
              </div>

              {/* Logcat/Problems Drawers */}
              <div className={`${isConsoleExpanded ? 'h-56' : 'h-[36px]'} shrink-0 transition-all duration-200`}>
                <ConsolePanel isExpanded={isConsoleExpanded} onToggleExpand={() => setIsConsoleExpanded(!isConsoleExpanded)} />
              </div>
            </div>
          )}

          {/* Right Column: Full-Height Live Preview (Design Panel) */}
          {(layoutMode === 'split' || layoutMode === 'design') && (
            <section className={`${layoutMode === 'design' ? 'flex-1' : 'w-[420px] shrink-0'} flex flex-col overflow-hidden`}>
              
              {/* View mode overrides when in pure Design view */}
              {layoutMode === 'design' && (
                <div className="h-8 bg-[#1e1f22] border border-[#2b2d30] border-b-0 rounded-t-md flex items-center justify-end px-2 shrink-0 select-none">
                  <div className="flex items-center border border-[#2b2d30] rounded overflow-hidden p-0.5 bg-[#2b2d30]">
                    <button
                      className="px-2 py-0.5 text-[10px] font-medium text-[#9da5b4] hover:text-[#dfe1e5]"
                      onClick={() => setLayoutMode('code')}
                    >
                      Code
                    </button>
                    <button
                      className="px-2 py-0.5 text-[10px] font-medium text-[#9da5b4] hover:text-[#dfe1e5]"
                      onClick={() => setLayoutMode('split')}
                    >
                      Split
                    </button>
                    <button
                      className="px-2 py-0.5 text-[10px] font-medium bg-[#3574f0] text-white rounded-sm"
                      onClick={() => setLayoutMode('design')}
                    >
                      Design
                    </button>
                  </div>
                </div>
              )}

              {/* Full height Live Preview */}
              <div className={`flex-1 rounded-md overflow-hidden border border-[#2b2d30] ${
                layoutMode === 'design' ? 'border-t-0 rounded-t-none' : ''
              }`}>
                <LivePreview />
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Android Studio Style Popup Notification in bottom right corner */}
      {showNotification && (
        <div className={`absolute right-4 bottom-4 z-[9999] bg-[#2b2d30] border ${
          notificationType === 'error' ? 'border-red-500/30' : notificationType === 'warning' ? 'border-amber-500/30' : 'border-[#3c3f41]'
        } rounded-lg shadow-2xl p-3.5 max-w-sm w-80 animate-slide-in select-none`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${
                notificationType === 'error' ? 'bg-red-500' : notificationType === 'warning' ? 'bg-amber-500' : 'bg-green-500'
              }`} />
              <span className="text-xs font-semibold text-[#dfe1e5]">
                {notificationType === 'error' ? 'Build Failed' : notificationType === 'warning' ? 'Build with Warnings' : 'Build Succeeded'}
              </span>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="text-[#9da5b4] hover:text-[#dfe1e5] text-[10px] font-bold px-1"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-[#9da5b4] mt-1.5 font-mono">
            {notificationType === 'error' 
              ? `Finished with ${errorsCount} error(s) in MainActivity.kt`
              : notificationType === 'warning'
                ? `Finished with ${warningsCount} warning(s) in MainActivity.kt`
                : 'Compilation successful. App preview is up to date.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
