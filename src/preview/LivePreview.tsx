import React, { useState } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ComposeWebRenderer } from '../renderer/react/reactRenderer';
import { Interpreter } from '../runtime/state/interpreter';
import { interpreterGlobals } from '../language/registry/defaultRegistries';
import { Monitor, Smartphone, Tablet, RotateCcw, Info, Eye, EyeOff, ZoomIn, ZoomOut } from 'lucide-react';

export const LivePreview: React.FC = () => {
  const ast = useWorkspaceStore((state) => state.ast);
  const runtimeState = useWorkspaceStore((state) => state.runtimeState);
  const setRuntimeStateVal = useWorkspaceStore((state) => state.setRuntimeStateVal);
  const resetRuntimeState = useWorkspaceStore((state) => state.resetRuntimeState);
  const selectedNodeId = useWorkspaceStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useWorkspaceStore((state) => state.setSelectedNodeId);
  const hoveredNodeId = useWorkspaceStore((state) => state.hoveredNodeId);
  const inspectMode = useWorkspaceStore((state) => state.inspectMode);
  const setInspectMode = useWorkspaceStore((state) => state.setInspectMode);

  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('mobile');
  const [zoom, setZoom] = useState(0.8);

  // Initialize the interpreter
  const interpreter = new Interpreter(
    () => runtimeState,
    (name, val) => setRuntimeStateVal(name, val),
    ast
  );

  // Map the interpreterGlobals to the scope when rendering
  interpreterGlobals.Color = {
    ...interpreterGlobals.Color,
  } as any;

  // Add the runtime state variables as state wrapper objects in the scope
  const evaluationScope: Record<string, any> = {
    ...interpreterGlobals,
  };

  const getViewportClass = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] h-[667px] shadow-2xl border-[12px] border-[#2b2d30] rounded-[32px] overflow-y-auto bg-[#1e1f22] transition-all';
      case 'tablet':
        return 'w-[768px] h-[1024px] shadow-2xl border-[16px] border-[#2b2d30] rounded-[24px] overflow-y-auto bg-[#1e1f22] transition-all origin-top scale-75 lg:scale-90 xl:scale-100';
      default:
        return 'w-full h-full bg-[#1e1f22] transition-all';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1f22] border border-[#2b2d30] rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 bg-[#2b2d30] border-b border-[#3c3f41] flex items-center justify-between select-none">
        {/* Viewport Sizing */}
        <div className="flex items-center space-x-1.5">
          <button
            className={`p-1.5 rounded transition-colors ${
              viewport === 'desktop' ? 'bg-[#3c3f41] text-blue-400' : 'text-[#9da5b4] hover:text-[#dfe1e5]'
            }`}
            onClick={() => setViewport('desktop')}
            title="Desktop Mode"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${
              viewport === 'tablet' ? 'bg-[#3c3f41] text-blue-400' : 'text-[#9da5b4] hover:text-[#dfe1e5]'
            }`}
            onClick={() => setViewport('tablet')}
            title="Tablet Mode"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            className={`p-1.5 rounded transition-colors ${
              viewport === 'mobile' ? 'bg-[#3c3f41] text-blue-400' : 'text-[#9da5b4] hover:text-[#dfe1e5]'
            }`}
            onClick={() => setViewport('mobile')}
            title="Mobile Mode"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#3c3f41] mx-2" />

          {/* Inspect Mode */}
          <button
            className={`px-2 py-1 rounded text-xs font-mono flex items-center transition-colors ${
              inspectMode ? 'bg-blue-600 text-white font-medium' : 'bg-[#3c3f41] text-[#9da5b4] hover:text-[#dfe1e5]'
            }`}
            onClick={() => setInspectMode(!inspectMode)}
            title="Inspector Mode: Click a component in preview to select it"
          >
            {inspectMode ? <Eye className="w-3.5 h-3.5 mr-1" /> : <EyeOff className="w-3.5 h-3.5 mr-1" />}
            Inspect
          </button>
        </div>
      </div>

      {/* Viewport Frame Wrapper */}
      <div className="flex-1 relative overflow-hidden bg-[#1e1f22]">
        {/* Scrollable Canvas Area */}
        <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
          <div className={getViewportClass()} style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
            <ComposeWebRenderer
              ast={ast}
              runtimeState={runtimeState}
              selectedNodeId={selectedNodeId}
              hoveredNodeId={hoveredNodeId}
              inspectMode={inspectMode}
              onSelectNode={setSelectedNodeId}
              interpreter={interpreter}
            />
          </div>
        </div>

        {/* Floating Zoom Controls in bottom right corner */}
        <div className="absolute right-4 bottom-4 bg-[#2b2d30] border border-[#3c3f41] rounded-md shadow-lg p-1 flex items-center space-x-1.5 z-50 select-none">
          <button
            className="p-1 rounded text-[#9da5b4] hover:text-[#dfe1e5] hover:bg-[#3c3f41] transition-colors"
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span
            className="text-[10px] font-mono text-[#9da5b4] min-w-[34px] text-center cursor-pointer hover:text-[#dfe1e5]"
            onClick={() => setZoom(0.8)}
            title="Reset Zoom to 80%"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="p-1 rounded text-[#9da5b4] hover:text-[#dfe1e5] hover:bg-[#3c3f41] transition-colors"
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* State variables trace board */}
      {Object.keys(runtimeState).length > 0 && (
        <div className="px-4 py-2 bg-[#2b2d30] border-t border-[#3c3f41] flex items-center overflow-x-auto space-x-4 max-h-12">
          <span className="text-[10px] font-mono text-[#5f6368] uppercase flex items-center shrink-0">
            <Info className="w-3 h-3 mr-1" /> Active States:
          </span>
          <div className="flex items-center space-x-3 overflow-x-auto">
            {Object.keys(runtimeState).map((key) => (
              <div key={key} className="flex items-center text-xs font-mono bg-[#1e1f22] px-2 py-0.5 border border-[#3c3f41] rounded shrink-0">
                <span className="text-[#9da5b4] mr-1">{key}:</span>
                <span className="text-amber-400 font-medium">
                  {JSON.stringify(runtimeState[key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
