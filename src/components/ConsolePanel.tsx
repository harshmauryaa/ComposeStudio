import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ExportPanel } from './ExportPanel';
import { Terminal, AlertTriangle, Trash2, CheckCircle2, FileCode, ChevronDown, ChevronUp } from 'lucide-react';

interface ConsolePanelProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ isExpanded = true, onToggleExpand }) => {
  const diagnostics = useWorkspaceStore((state) => state.diagnostics);
  const consoleLogs = useWorkspaceStore((state) => state.consoleLogs);
  const clearConsole = useWorkspaceStore((state) => state.clearConsole);
  const setSelectedNodeId = useWorkspaceStore((state) => state.setSelectedNodeId);

  const [activeTab, setActiveTab] = useState<'problems' | 'logcat' | 'export'>('problems');

  const handleTabClick = (tab: 'problems' | 'logcat' | 'export') => {
    setActiveTab(tab);
    if (!isExpanded && onToggleExpand) {
      onToggleExpand();
    }
  };

  const errorsCount = diagnostics.filter(d => d.severity === 'error').length;

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1f22] border border-[#2b2d30] rounded-md overflow-hidden font-mono text-[11px]">
      {/* IntelliJ / Android Studio Bottom Tab Bar */}
      <div className="px-2 bg-[#1e1f22] border-b border-[#2b2d30] flex items-center justify-between h-9 select-none shrink-0">
        <div className="flex h-full items-center">
          {/* Problems Tab */}
          <button
            className={`px-3 py-2 flex items-center space-x-1.5 transition-colors border-b-2 text-[11px] h-full ${
              activeTab === 'problems'
                ? 'border-[#3574f0] text-[#dfe1e5] font-semibold bg-[#2b2d30]/40'
                : 'border-transparent text-[#9da5b4] hover:text-[#dfe1e5]'
            }`}
            onClick={() => handleTabClick('problems')}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Problems</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
              errorsCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-[#2b2d30] text-[#5f6368]'
            }`}>
              {diagnostics.length}
            </span>
          </button>

          {/* Logcat Tab */}
          <button
            className={`px-3 py-2 flex items-center space-x-1.5 transition-colors border-b-2 text-[11px] h-full ${
              activeTab === 'logcat'
                ? 'border-[#3574f0] text-[#dfe1e5] font-semibold bg-[#2b2d30]/40'
                : 'border-transparent text-[#9da5b4] hover:text-[#dfe1e5]'
            }`}
            onClick={() => handleTabClick('logcat')}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Logcat</span>
          </button>

          {/* Export Build Tab */}
          <button
            className={`px-3 py-2 flex items-center space-x-1.5 transition-colors border-b-2 text-[11px] h-full ${
              activeTab === 'export'
                ? 'border-[#3574f0] text-[#dfe1e5] font-semibold bg-[#2b2d30]/40'
                : 'border-transparent text-[#9da5b4] hover:text-[#dfe1e5]'
            }`}
            onClick={() => handleTabClick('export')}
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Build & Export</span>
          </button>
        </div>

        <div className="flex items-center space-x-1">
          {activeTab === 'logcat' && (
            <button
              className="p-1.5 text-[#9da5b4] hover:text-red-400 hover:bg-[#2b2d30]/50 rounded transition-colors"
              onClick={clearConsole}
              title="Clear Logcat Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onToggleExpand && (
            <button
              className="p-1.5 text-[#9da5b4] hover:text-[#dfe1e5] hover:bg-[#2b2d30]/50 rounded transition-colors"
              onClick={onToggleExpand}
              title={isExpanded ? "Minimize Tool Window" : "Restore Tool Window"}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-[#18191b] overflow-y-auto">
        {activeTab === 'problems' && (
          <div className="p-3 space-y-1.5">
            {diagnostics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[#9da5b4] text-center">
                <CheckCircle2 className="w-8 h-8 mb-1.5 text-emerald-500/60" />
                <span className="text-xs text-[#dfe1e5] font-medium">No problems found</span>
                <span className="text-[10px] text-[#5f6368] mt-0.5">Kotlin compiler parsed layout with zero errors.</span>
              </div>
            ) : (
              diagnostics.map((diag, index) => (
                <div
                  key={index}
                  className={`flex items-start p-2 rounded cursor-pointer transition-colors border ${
                    diag.severity === 'error'
                      ? 'bg-red-500/5 border-red-500/10 hover:bg-red-500/10 text-red-400'
                      : 'bg-amber-500/5 border-amber-500/10 hover:bg-amber-500/10 text-amber-400'
                  }`}
                  onClick={() => {
                    setSelectedNodeId(null);
                  }}
                >
                  <AlertTriangle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase text-[9px]">
                        [{diag.severity}]
                      </span>
                      <span className="text-[9px] text-[#5f6368]">
                        MainActivity.kt:{diag.line}:{diag.column}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[#dfe1e5] font-mono text-[11px] leading-relaxed">
                      {diag.message}
                    </p>
                    {diag.fixSuggestion && (
                      <p className="mt-1 text-blue-400 text-[10px] font-sans">
                        Tip: {diag.fixSuggestion}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'logcat' && (
          <div className="p-3 space-y-1 select-text bg-[#1e1f22]">
            {consoleLogs.length === 0 ? (
              <div className="text-[#5f6368] py-4 text-center">Logcat console is empty.</div>
            ) : (
              consoleLogs.map((log, index) => {
                let level = 'I';
                let levelColor = 'text-blue-400';
                if (log.toLowerCase().includes('error') || log.toLowerCase().includes('failed') || log.toLowerCase().includes('exception')) {
                  level = 'E';
                  levelColor = 'text-red-400';
                } else if (log.toLowerCase().includes('warning') || log.toLowerCase().includes('warn')) {
                  level = 'W';
                  levelColor = 'text-amber-400';
                }
                const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 23);
                return (
                  <div key={index} className="text-[#dfe1e5] py-0.5 leading-relaxed font-mono border-b border-[#2b2d30]/20 last:border-0 whitespace-pre-wrap">
                    <span className="text-[#5f6368] mr-2">{timeStr}</span>
                    <span className="text-[#888] mr-2">2495-2530</span>
                    <span className="text-[#9da5b4] font-semibold mr-2">ComposeRuntime</span>
                    <span className={`${levelColor} font-bold mr-3`}>{level}</span>
                    <span>{log}</span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="h-full">
            <ExportPanel />
          </div>
        )}
      </div>
    </div>
  );
};
