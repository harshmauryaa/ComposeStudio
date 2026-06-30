import { ModifierRegistry } from '../../language/registry/registry';

/**
 * Resolves a Modifier Chain AST node into inline React CSS styles and click event handlers.
 */
export function resolveModifierChain(
  modifierNode: any,
  interpreter: any,
  scope: any
): { style: React.CSSProperties; onClick?: (e: any) => void } {
  const style: React.CSSProperties = {};
  let onClick: ((e: any) => void) | undefined = undefined;

  if (!modifierNode || modifierNode.type !== 'ModifierChain') {
    return { style };
  }

  const registry = ModifierRegistry.getInstance();

  modifierNode.calls.forEach((call: any) => {
    const spec = registry.get(call.name);
    if (!spec) return;

    // Evaluate arguments
    const args: any[] = [];
    const namedArgs: Record<string, any> = {};

    call.arguments.forEach((arg: any) => {
      if (arg.type === 'Argument') {
        const val = interpreter.evaluate(arg.value, scope);
        if (arg.name) {
          namedArgs[arg.name] = val;
        } else {
          args.push(val);
        }
      } else {
        args.push(interpreter.evaluate(arg, scope));
      }
    });

    if (call.name === 'clickable') {
      const clickHandler = args[0] || Object.values(namedArgs)[0];
      if (typeof clickHandler === 'function') {
        onClick = (e: any) => {
          e.stopPropagation(); // Avoid bubbling in live preview
          clickHandler();
        };
      }
    } else {
      // Map to CSS styles
      const cssStyles = spec.toCSS(args, namedArgs);
      // Convert standard kebab-case CSS to camelCase React properties
      Object.keys(cssStyles).forEach(key => {
        const reactKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
        (style as any)[reactKey] = cssStyles[key];
      });
    }
  });

  return { style, onClick };
}
