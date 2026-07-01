import type { ASTNode } from '../../language/ast/ast';
import { ComponentRegistry } from '../../language/registry/registry';
import { resolveModifierChain } from '../../runtime/modifier/modifierResolver';
import { Interpreter } from '../../runtime/state/interpreter';
import { interpreterGlobals } from '../../language/registry/defaultRegistries';

export interface ExportResult {
  html: string;
  css: string;
}

/**
 * Traverses the parsed Compose AST, evaluates simple branches and variables,
 * compiles modifiers to stylesheet rules, and returns static HTML and CSS content.
 */
export function generateStaticExport(
  ast: ASTNode | null,
  runtimeState: Record<string, any>
): ExportResult {
  if (!ast) {
    return { html: '', css: '' };
  }

  const cssRules: Record<string, Record<string, string>> = {};
  let classCounter = 0;

  // Setup mock interpreter for evaluation during static exporting
  const interpreter = new Interpreter(
    () => runtimeState,
    () => {},
    ast
  );

  const context = {
    interpreter,
    scope: { ...interpreterGlobals },
  };

  function traverse(node: ASTNode): string {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return node.body.map(child => traverse(child)).join('\n');

      case 'StateDeclaration':
        return '';

      case 'IfStatement': {
        const condVal = interpreter.evaluate(node.condition, context.scope);
        if (condVal) {
          return node.thenBody.map(child => traverse(child)).join('\n');
        } else if (node.elseBody) {
          return node.elseBody.map(child => traverse(child)).join('\n');
        }
        return '';
      }

      case 'For': {
        const iterable = interpreter.evaluate((node as any).iterable, context.scope);
        const htmlResults: string[] = [];
        if (Array.isArray(iterable)) {
          iterable.forEach((item) => {
            const prevScope = context.scope;
            context.scope = { ...context.scope, [(node as any).varName]: item };
            (node as any).body.forEach((bodyChild: any) => {
              htmlResults.push(traverse(bodyChild));
            });
            context.scope = prevScope;
          });
        }
        return htmlResults.join('\n');
      }

      case 'ComposableCall': {
        const spec = ComponentRegistry.getInstance().get(node.name);
        if (!spec) return '';

        // Resolve props
        const props: Record<string, any> = {};
        const allowedParams = spec.allowedParams;
        const formalParamKeys = Object.keys(allowedParams);

        node.arguments.forEach((arg, index) => {
          let paramName = arg.name;
          if (!paramName) {
            paramName = formalParamKeys[index];
          }
          if (paramName) {
            props[paramName] = interpreter.evaluate(arg.value, context.scope);
          }
        });

        // Traverse children
        const childrenHtml = node.body.map(child => traverse(child)).join('\n');

        // Resolve modifier styles
        let className = '';
        if (props.modifier) {
          const { style } = resolveModifierChain(props.modifier, interpreter, context.scope);
          if (Object.keys(style).length > 0) {
            classCounter++;
            className = `c-node-${classCounter}`;
            cssRules[className] = style as any;
          }
        }

        // Custom HTML render
        let innerHtml = '';
        if (spec.htmlRender) {
          innerHtml = spec.htmlRender(props, childrenHtml);
        } else {
          innerHtml = childrenHtml;
        }

        // If a class was generated, inject it into the root tag of the inner HTML
        if (className) {
          if (innerHtml.startsWith('<') && !innerHtml.startsWith('<!')) {
            const firstTagClose = innerHtml.indexOf('>');
            const tagContent = innerHtml.substring(0, firstTagClose);

            // Check if class attribute already exists
            if (tagContent.includes('class="')) {
              innerHtml = innerHtml.replace('class="', `class="${className} `);
            } else {
              // Inject class attribute
              innerHtml = `<${tagContent.substring(1)} class="${className}"` + innerHtml.substring(firstTagClose);
            }
          } else {
            innerHtml = `<div class="${className}">${innerHtml}</div>`;
          }
        }

        return innerHtml;
      }

      case 'ErrorNode':
        return `<!-- Syntax Error: ${node.message} -->`;

      default:
        return '';
    }
  }

  const rawHtml = traverse(ast);

  // Format CSS Rules
  let cssText = `/* Compiled via Compose Studio */
body {
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
  box-sizing: border-box;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

  Object.keys(cssRules).forEach(cls => {
    const rules = cssRules[cls];
    const ruleStr = Object.keys(rules)
      .map(prop => {
        // Convert camelCase prop to kebab-case CSS prop
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `  ${cssProp}: ${rules[prop]};`;
      })
      .join('\n');
    cssText += `\n.${cls} {\n${ruleStr}\n}\n`;
  });

  return {
    html: rawHtml,
    css: cssText,
  };
}
