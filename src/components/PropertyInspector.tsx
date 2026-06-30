import React from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ComponentRegistry } from '../language/registry/registry';
import type { ComposableCallNode, LiteralNode } from '../language/ast/ast';
import { updateComposableArgument } from '../utils/sourceModifier';
import { Settings, Plus, Info } from 'lucide-react';

export const PropertyInspector: React.FC = () => {
  const code = useWorkspaceStore((state) => state.code);
  const setCode = useWorkspaceStore((state) => state.setCode);
  const selectedNodeId = useWorkspaceStore((state) => state.selectedNodeId);
  const ast = useWorkspaceStore((state) => state.ast);

  // Helper to find node in AST
  const findNode = (root: any, targetId: string): ComposableCallNode | null => {
    if (!root) return null;
    if (root.id === targetId && root.type === 'ComposableCall') {
      return root;
    }
    if (root.body && Array.isArray(root.body)) {
      for (const child of root.body) {
        const found = findNode(child, targetId);
        if (found) return found;
      }
    }
    if (root.thenBody && Array.isArray(root.thenBody)) {
      for (const child of root.thenBody) {
        const found = findNode(child, targetId);
        if (found) return found;
      }
    }
    if (root.elseBody && Array.isArray(root.elseBody)) {
      for (const child of root.elseBody) {
        const found = findNode(child, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = ast && selectedNodeId ? findNode(ast, selectedNodeId) : null;

  if (!selectedNode) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider select-none flex items-center">
          <Settings className="w-4 h-4 mr-2" /> Properties
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
          <Info className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-xs font-mono">Select a component in the tree or live preview to inspect its properties.</p>
        </div>
      </div>
    );
  }

  const spec = ComponentRegistry.getInstance().get(selectedNode.name);
  if (!spec) {
    return (
      <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-4">
        <span className="text-xs text-red-400 font-mono">Unknown Component spec: {selectedNode.name}</span>
      </div>
    );
  }

  const allowedParams = spec.allowedParams;
  const formalParamKeys = Object.keys(allowedParams);

  const getArgumentInfo = (paramName: string) => {
    // Check if parameter has an argument
    const arg = selectedNode.arguments.find(
      (a) => a.name === paramName || (!a.name && selectedNode.arguments.indexOf(a) === 0 && paramName === 'text')
    );
    return arg;
  };

  const handlePropertyChange = (paramName: string, valueString: string) => {
    const nextCode = updateComposableArgument(code, selectedNode, paramName, valueString);
    setCode(nextCode);
  };

  // Get presets for enums
  const getEnumOptions = (paramName: string) => {
    switch (paramName) {
      case 'fontWeight':
        return ['FontWeight.Normal', 'FontWeight.Medium', 'FontWeight.SemiBold', 'FontWeight.Bold'];
      case 'fontStyle':
        return ['FontStyle.Normal', 'FontStyle.Italic'];
      case 'textAlign':
        return ['TextAlign.Left', 'TextAlign.Center', 'TextAlign.Right'];
      case 'textDecoration':
        return ['TextDecoration.None', 'TextDecoration.Underline', 'TextDecoration.LineThrough'];
      default:
        return [];
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider select-none flex items-center justify-between">
        <div className="flex items-center">
          <Settings className="w-4 h-4 mr-2 text-slate-400" />
          <span>Properties</span>
        </div>
        <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded">
          {selectedNode.name}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {formalParamKeys.map((paramName) => {
          const type = allowedParams[paramName];
          const arg = getArgumentInfo(paramName);
          const hasVal = !!arg;
          
          let displayVal = '';
          if (hasVal && arg.value.type === 'Literal') {
            const lit = arg.value as LiteralNode;
            displayVal = String(lit.value);
          } else if (hasVal && arg.value.type === 'ModifierChain') {
            displayVal = 'Modifier Chain';
          } else if (hasVal) {
            displayVal = 'Dynamic Expression';
          }

          return (
            <div key={paramName} className="flex flex-col space-y-1 pb-3 border-b border-slate-800/60 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-slate-400">{paramName}</span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded uppercase">
                  {type}
                </span>
              </div>

              {!hasVal ? (
                <button
                  className="flex items-center justify-center w-full py-1 border border-dashed border-slate-700 hover:border-blue-500/40 text-slate-500 hover:text-blue-400 rounded text-xs transition-colors font-mono"
                  onClick={() => {
                    // Initialize parameter value with smart defaults
                    let initialValStr = '""';
                    if (type === 'number' || type === 'float') initialValStr = '0';
                    else if (type === 'boolean') initialValStr = 'false';
                    else if (type === 'dp') initialValStr = '16.dp';
                    else if (type === 'color') initialValStr = 'Color.White';
                    else if (type === 'modifier') initialValStr = 'Modifier';
                    else if (type === 'enum') {
                      const options = getEnumOptions(paramName);
                      initialValStr = options[0] || 'null';
                    }
                    handlePropertyChange(paramName, initialValStr);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add {paramName}
                </button>
              ) : (
                <div className="flex items-center">
                  {type === 'string' && (
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded px-2.5 py-1 text-xs text-slate-300 font-mono outline-none"
                      value={displayVal}
                      onChange={(e) => handlePropertyChange(paramName, `"${e.target.value}"`)}
                    />
                  )}

                  {type === 'boolean' && (
                    <label className="inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        className="rounded border-slate-800 bg-slate-950 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 w-4 h-4"
                        checked={displayVal === 'true'}
                        onChange={(e) => handlePropertyChange(paramName, String(e.target.checked))}
                      />
                      <span className="ml-2 text-xs font-mono text-slate-400">
                        {displayVal === 'true' ? 'True' : 'False'}
                      </span>
                    </label>
                  )}

                  {type === 'dp' && (
                    <div className="flex items-center space-x-2 w-full">
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded px-2.5 py-1 text-xs text-slate-300 font-mono outline-none"
                        value={displayVal.endsWith('.dp') ? displayVal : `${displayVal}.dp`}
                        onChange={(e) => {
                          const val = e.target.value;
                          handlePropertyChange(paramName, val.includes('dp') ? val : `${val}.dp`);
                        }}
                      />
                    </div>
                  )}

                  {type === 'color' && (
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded px-2.5 py-1 text-xs text-slate-300 font-mono outline-none"
                      value={displayVal}
                      onChange={(e) => handlePropertyChange(paramName, e.target.value)}
                    />
                  )}

                  {type === 'enum' && (
                    <select
                      className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded px-2.5 py-1 text-xs text-slate-300 font-mono outline-none cursor-pointer"
                      value={displayVal}
                      onChange={(e) => handlePropertyChange(paramName, e.target.value)}
                    >
                      {getEnumOptions(paramName).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.split('.')[1] || opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {type === 'modifier' && (
                    <span className="text-[11px] font-mono text-slate-500 italic">
                      Edit modifier chains directly in the code editor.
                    </span>
                  )}

                  {type === 'lambda' && (
                    <span className="text-[11px] font-mono text-slate-500 italic">
                      Edit event code blocks directly in code editor.
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
