import React from 'react';
import type { ASTNode } from '../../language/ast/ast';
import { ComponentRegistry } from '../../language/registry/registry';
import { Interpreter } from '../../runtime/state/interpreter';
import { interpreterGlobals } from '../../language/registry/defaultRegistries';

interface ComposeWebRendererProps {
  ast: ASTNode | null;
  runtimeState: Record<string, any>;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  inspectMode: boolean;
  onSelectNode: (nodeId: string | null) => void;
  interpreter: Interpreter;
}

export const ComposeWebRenderer: React.FC<ComposeWebRendererProps> = ({
  ast,
  runtimeState: _runtimeState,
  selectedNodeId,
  hoveredNodeId,
  inspectMode,
  onSelectNode,
  interpreter,
}) => {
  if (!ast) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-mono text-sm">
        No AST loaded. Fix syntax errors or write Compose code to preview.
      </div>
    );
  }

  // Create context that will be passed down to each registered component's render function
  const context = {
    selectedNodeId,
    hoveredNodeId,
    inspectMode,
    onSelectNode,
    interpreter,
    scope: { ...interpreterGlobals },
  };

  return <>{renderASTNode(ast, context)}</>;
};

function renderASTNode(node: ASTNode, context: any): React.ReactNode {
  if (!node) return null;

  switch (node.type) {
    case 'Program':
      return (
        <>
          {node.body.map(child => (
            <React.Fragment key={child.id}>
              {renderASTNode(child, context)}
            </React.Fragment>
          ))}
        </>
      );

    case 'StateDeclaration':
      // State declarations hold metadata and are evaluated at compilation time, no visual nodes
      return null;

    case 'IfStatement': {
      // Evaluate condition expression
      const conditionVal = context.interpreter.evaluate(node.condition, context.scope);
      if (conditionVal) {
        return (
          <>
            {node.thenBody.map(child => (
              <React.Fragment key={child.id}>
                {renderASTNode(child, context)}
              </React.Fragment>
            ))}
          </>
        );
      } else if (node.elseBody) {
        return (
          <>
            {node.elseBody.map(child => (
              <React.Fragment key={child.id}>
                {renderASTNode(child, context)}
              </React.Fragment>
            ))}
          </>
        );
      }
      return null;
    }

    case 'For': {
      const iterable = context.interpreter.evaluate((node as any).iterable, context.scope);
      const results: React.ReactNode[] = [];
      if (Array.isArray(iterable)) {
        iterable.forEach((item, index) => {
          const loopScope = { ...context.scope, [(node as any).varName]: item };
          const loopContext = { ...context, scope: loopScope };
          
          (node as any).body.forEach((bodyChild: any, childIdx: number) => {
            results.push(
              <React.Fragment key={`${bodyChild.id}-${index}-${childIdx}`}>
                {renderASTNode(bodyChild, loopContext)}
              </React.Fragment>
            );
          });
        });
      }
      return <>{results}</>;
    }

    case 'ComposableCall': {
      const spec = ComponentRegistry.getInstance().get(node.name);
      
      if (!spec) {
        return (
          <div
            key={node.id}
            className="text-red-400 border border-red-500/50 bg-red-950/30 p-3 rounded my-2 text-xs font-mono"
            style={{ boxSizing: 'border-box' }}
          >
            Unknown Component: &lt;{node.name} /&gt;
          </div>
        );
      }

      // Map AST arguments to evaluated Javascript props
      const props: Record<string, any> = {};
      const allowedParams = spec.allowedParams;
      const formalParamKeys = Object.keys(allowedParams);

      node.arguments.forEach((arg, index) => {
        let paramName = arg.name;
        if (!paramName) {
          // Map positional argument by index
          paramName = formalParamKeys[index];
        }

        if (paramName) {
          props[paramName] = context.interpreter.evaluate(arg.value, context.scope);
        }
      });

      // Render nested children block recursively
      const childrenElements = node.body.map(child => renderASTNode(child, context));

      // Inject node context
      const elementContext = {
        ...context,
        nodeId: node.id,
      };

      try {
        const rendered = spec.render(props, childrenElements, elementContext);
        return <React.Fragment key={node.id}>{rendered}</React.Fragment>;
      } catch (err: any) {
        return (
          <div
            key={node.id}
            className="text-red-500 border border-red-500 p-2 text-xs font-mono my-1"
          >
            Error rendering {node.name}: {err.message || err}
          </div>
        );
      }
    }

    case 'ErrorNode':
      return (
        <div
          key={node.id}
          className="text-amber-500 border border-dashed border-amber-500/30 bg-amber-950/10 p-2 rounded my-1 text-xs font-mono"
        >
          Parsing/Syntax Error: {node.message}
        </div>
      );

    default:
      return null;
  }
}
