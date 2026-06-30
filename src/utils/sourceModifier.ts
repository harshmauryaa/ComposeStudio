import type { ComposableCallNode } from '../language/ast/ast';

/**
 * Updates the source code string by changing or adding a parameter value on a Composable call.
 */
export function updateComposableArgument(
  code: string,
  node: ComposableCallNode,
  paramName: string,
  newValueStr: string
): string {
  // Find if argument already exists
  const existingArg = node.arguments.find(
    (arg) => arg.name === paramName || (!arg.name && node.arguments.indexOf(arg) === 0 && paramName === 'text')
  );

  if (existingArg) {
    // Replace the exact range of the argument
    const start = existingArg.range.start.offset;
    const end = existingArg.range.end.offset;
    const isNamed = !!existingArg.name;
    const replacement = isNamed ? `${paramName} = ${newValueStr}` : newValueStr;
    
    return code.substring(0, start) + replacement + code.substring(end);
  }

  // Argument does not exist. We need to insert it.
  const name = node.name;
  
  // Find where the composable name is in the source code using the node's start position
  const nameStartOffset = node.range.start.offset;
  const nameEndOffset = nameStartOffset + name.length;

  // Check if call has parentheses
  const codeAfterName = code.substring(nameEndOffset);
  const openParenIndex = codeAfterName.search(/\s*\(/);

  if (openParenIndex === -1 || openParenIndex > 5) {
    // Case 1: No parenthesis exists (e.g. Column { ... }). Inject (paramName = newValueStr)
    const injectOffset = nameEndOffset;
    return (
      code.substring(0, injectOffset) +
      `(${paramName} = ${newValueStr})` +
      code.substring(injectOffset)
    );
  }

  // Case 2: Parentheses exist. Find them.
  const actualOpenParenOffset = nameEndOffset + openParenIndex + codeAfterName.match(/\s*\(/)![0].length - 1;

  if (node.arguments.length === 0) {
    // Case 2a: Empty parentheses (e.g., Column() { ... }). Insert inside parentheses.
    const injectOffset = actualOpenParenOffset + 1;
    return (
      code.substring(0, injectOffset) +
      `${paramName} = ${newValueStr}` +
      code.substring(injectOffset)
    );
  }

  // Case 2b: Has other arguments (e.g., Column(modifier = Modifier.padding(16.dp)) { ... }).
  // Find the end offset of the last argument.
  const lastArg = node.arguments[node.arguments.length - 1];
  const lastArgEndOffset = lastArg.range.end.offset;

  return (
    code.substring(0, lastArgEndOffset) +
    `, ${paramName} = ${newValueStr}` +
    code.substring(lastArgEndOffset)
  );
}
