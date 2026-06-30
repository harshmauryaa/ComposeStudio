import React from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { ASTNode, ComposableCallNode } from '../language/ast/ast';
import { Folder, FileText, Play, ToggleLeft, Layers, Image as ImageIcon } from 'lucide-react';

export const ComponentTree: React.FC = () => {
  const ast = useWorkspaceStore((state) => state.ast);
  const selectedNodeId = useWorkspaceStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useWorkspaceStore((state) => state.setSelectedNodeId);
  const hoveredNodeId = useWorkspaceStore((state) => state.hoveredNodeId);
  const setHoveredNodeId = useWorkspaceStore((state) => state.setHoveredNodeId);

  const getComponentIcon = (name: string) => {
    switch (name) {
      case 'Column':
      case 'Row':
      case 'Box':
        return <Folder className="w-4 h-4 text-blue-400 mr-2 shrink-0" />;
      case 'Text':
        return <FileText className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />;
      case 'Button':
      case 'IconButton':
        return <Play className="w-4 h-4 text-violet-400 mr-2 shrink-0" />;
      case 'TextField':
      case 'Checkbox':
      case 'Switch':
        return <ToggleLeft className="w-4 h-4 text-amber-400 mr-2 shrink-0" />;
      case 'Card':
      case 'Surface':
        return <Layers className="w-4 h-4 text-sky-400 mr-2 shrink-0" />;
      case 'Image':
        return <ImageIcon className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-[#9da5b4] mr-2 shrink-0" />;
    }
  };

  const renderTreeNode = (node: ASTNode, depth: number = 0): React.ReactNode => {
    if (!node) return null;

    if (node.type === 'ComposableCall') {
      const call = node as ComposableCallNode;
      const isSelected = call.id === selectedNodeId;
      const isHovered = call.id === hoveredNodeId;

      return (
        <div key={call.id} className="flex flex-col">
          <div
            className={`flex items-center px-3 py-1 cursor-pointer transition-colors select-none text-sm border-l-2 ${
              isSelected
                ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-medium'
                : isHovered
                  ? 'bg-[#2b2d30] border-[#3c3f41] text-[#dfe1e5]'
                  : 'border-transparent text-[#9da5b4] hover:bg-[#2b2d30]/50 hover:text-[#dfe1e5]'
            }`}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => setSelectedNodeId(call.id)}
            onMouseEnter={() => setHoveredNodeId(call.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            {getComponentIcon(call.name)}
            <span>{call.name}</span>
          </div>

          {call.body && call.body.length > 0 && (
            <div className="flex flex-col">
              {call.body.map((child) => renderTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (node.type === 'IfStatement') {
      return (
        <div key={node.id} className="flex flex-col">
          <div
            className="flex items-center px-3 py-1 text-xs text-amber-500 font-mono"
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            <span>if (condition)</span>
          </div>
          {node.thenBody.map((child) => renderTreeNode(child, depth + 1))}
          {node.elseBody && node.elseBody.map((child) => renderTreeNode(child, depth + 1))}
        </div>
      );
    }

    if (node.type === 'Program') {
      return (
        <div className="flex flex-col">
          {node.body.map((child) => renderTreeNode(child, depth))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1f22] border border-[#2b2d30] rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-[#1e1f22] border-b border-[#2b2d30] text-xs font-semibold text-[#9da5b4] uppercase tracking-wider select-none">
        Component Tree
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {ast ? (
          renderTreeNode(ast)
        ) : (
          <div className="text-xs text-[#5f6368] font-mono p-4 text-center">
            No valid AST to map.
          </div>
        )}
      </div>
    </div>
  );
};
