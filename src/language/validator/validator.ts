import type { ASTNode, ComposableCallNode, ModifierChainNode, LiteralNode } from '../ast/ast';
import type { Diagnostic } from '../parser/parser';
import { ComponentRegistry, ModifierRegistry } from '../registry/registry';
import type { ParamType } from '../registry/registry';

export class Validator {
  private diagnostics: Diagnostic[] = [];

  constructor() {}

  public validate(ast: ASTNode): Diagnostic[] {
    this.diagnostics = [];
    this.validateNode(ast);
    return this.diagnostics;
  }

  private report(
    severity: 'error' | 'warning',
    message: string,
    node: ASTNode,
    fixSuggestion?: string
  ) {
    this.diagnostics.push({
      severity,
      message,
      line: node.range.start.line,
      column: node.range.start.column,
      startOffset: node.range.start.offset,
      endOffset: node.range.end.offset,
      fixSuggestion,
    });
  }

  private validateNode(node: ASTNode) {
    switch (node.type) {
      case 'Program':
        node.body.forEach(child => this.validateNode(child));
        break;

      case 'StateDeclaration':
        if (node.defaultValue.type !== 'Literal') {
          this.report('error', 'State default value must be a literal.', node.defaultValue);
        }
        break;

      case 'ComposableCall':
        this.validateComposableCall(node);
        break;

      case 'ModifierChain':
        this.validateModifierChain(node);
        break;

      case 'Lambda':
        node.body.forEach(child => this.validateNode(child));
        break;

      case 'Assignment':
        this.validateNode(node.value);
        break;

      case 'BinaryExpression':
        this.validateNode(node.left);
        this.validateNode(node.right);
        break;

      case 'PropertyAccess':
        this.validateNode(node.object);
        break;

      case 'IfStatement':
        this.validateNode(node.condition);
        node.thenBody.forEach(child => this.validateNode(child));
        if (node.elseBody) {
          node.elseBody.forEach(child => this.validateNode(child));
        }
        break;

      case 'UnaryExpression':
        this.validateNode(node.argument);
        break;

      case 'For':
        this.validateNode((node as any).iterable);
        (node as any).body.forEach((child: any) => this.validateNode(child));
        break;

      case 'ErrorNode':
        this.report('error', node.message, node);
        break;

      default:
        break;
    }
  }

  private validateComposableCall(node: ComposableCallNode) {
    const compRegistry = ComponentRegistry.getInstance();
    const spec = compRegistry.get(node.name);

    if (!spec) {
      this.report(
        'error',
        `Unknown component '${node.name}'. Make sure it is registered.`,
        node,
        `Did you mean Text or Column?`
      );
      // Validate arguments/children regardless to catch sub-errors
      node.arguments.forEach(arg => this.validateNode(arg.value));
      node.body.forEach(child => this.validateNode(child));
      return;
    }

    const providedParamNames = new Set<string>();
    const allowedParams = spec.allowedParams;

    // We mapping positional args to formal params by order
    const formalParamKeys = Object.keys(allowedParams);

    node.arguments.forEach((arg, index) => {
      let paramName = arg.name;
      if (!paramName) {
        // Map positional argument to index-based formal parameter
        paramName = formalParamKeys[index];
      }

      if (!paramName) {
        this.report('error', `Too many arguments provided to '${node.name}'`, arg);
        return;
      }

      providedParamNames.add(paramName);

      const expectedType = allowedParams[paramName];
      if (!expectedType) {
        this.report(
          'error',
          `Unknown parameter '${paramName}' for component '${node.name}'.`,
          arg,
          `Allowed parameters: ${formalParamKeys.join(', ')}`
        );
        return;
      }

      // Check parameter types
      this.validateArgValue(arg.value, expectedType, paramName, node.name);
    });

    // Check required parameters
    spec.requiredParams.forEach(requiredParam => {
      if (!providedParamNames.has(requiredParam)) {
        this.report(
          'error',
          `Missing required parameter '${requiredParam}' for component '${node.name}'.`,
          node
        );
      }
    });

    // Recursively validate children in block
    node.body.forEach(child => this.validateNode(child));
  }

  private validateArgValue(
    valueNode: ASTNode,
    expectedType: ParamType,
    paramName: string,
    compName: string
  ) {
    // Basic type validation
    if (expectedType === 'modifier') {
      if (valueNode.type !== 'ModifierChain') {
        this.report(
          'error',
          `Parameter '${paramName}' in '${compName}' expects a Modifier, but got '${valueNode.type}'.`,
          valueNode
        );
      } else {
        this.validateModifierChain(valueNode);
      }
      return;
    }

    if (expectedType === 'lambda') {
      if (valueNode.type !== 'Lambda') {
        if (paramName === 'placeholder' && valueNode.type === 'Literal' && (valueNode as any).literalType === 'string') {
          return;
        }
        this.report(
          'error',
          `Parameter '${paramName}' in '${compName}' expects a lambda block { ... }, but got '${valueNode.type}'.`,
          valueNode
        );
      } else {
        this.validateNode(valueNode);
      }
      return;
    }

    // Literal checks
    if (valueNode.type === 'Literal') {
      const lit = valueNode as LiteralNode;
      if (expectedType === 'string' && lit.literalType !== 'string') {
        this.report('error', `Type mismatch: expected String for '${paramName}', got ${lit.literalType}`, valueNode);
      } else if (expectedType === 'dp' && lit.literalType !== 'dp' && lit.literalType !== 'sp') {
        this.report('error', `Type mismatch: expected Dp (e.g. 16.dp) for '${paramName}', got ${lit.literalType}`, valueNode);
      } else if (expectedType === 'sp' && lit.literalType !== 'sp' && lit.literalType !== 'dp') {
        this.report('error', `Type mismatch: expected Sp (e.g. 14.sp) for '${paramName}', got ${lit.literalType}`, valueNode);
      } else if (expectedType === 'color' && lit.literalType !== 'color') {
        this.report('error', `Type mismatch: expected Color (e.g. Color.Red) for '${paramName}', got ${lit.literalType}`, valueNode);
      } else if (expectedType === 'enum' && lit.literalType !== 'enum') {
        this.report('error', `Type mismatch: expected Enum (e.g. Alignment.Center) for '${paramName}', got ${lit.literalType}`, valueNode);
      } else if (expectedType === 'boolean' && lit.literalType !== 'boolean') {
        this.report('error', `Type mismatch: expected Boolean for '${paramName}', got ${lit.literalType}`, valueNode);
      } else if (
        (expectedType === 'number' || expectedType === 'float') &&
        lit.literalType !== 'number' &&
        lit.literalType !== 'float'
      ) {
        this.report('error', `Type mismatch: expected Number/Float for '${paramName}', got ${lit.literalType}`, valueNode);
      }
    } else {
      // It's a reference or variable (e.g. PropertyAccess, Identifier, BinaryExpression)
      // Since it's dynamic at runtime, we pass validation but inspect children
      this.validateNode(valueNode);
    }
  }

  private validateModifierChain(node: ModifierChainNode) {
    const modRegistry = ModifierRegistry.getInstance();
    
    // Track seen modifiers in this chain to detect duplicates
    const seen = new Set<string>();

    node.calls.forEach(call => {
      const spec = modRegistry.get(call.name);

      if (!spec) {
        this.report(
          'error',
          `Unknown modifier '${call.name}'. Make sure it is registered.`,
          call,
          `Did you mean padding or background?`
        );
        return;
      }

      if (seen.has(call.name)) {
        this.report(
          'warning',
          `Duplicate modifier '${call.name}' detected in chain. Only the last will apply.`,
          call
        );
      }
      seen.add(call.name);

      // Verify modifier argument count & types
      // For modifiers that can have variable arguments (like padding), the registry can specify parameter mappings.
      // Let's check positional argument count
      const expectedParams = spec.paramTypes;
      
      // If expectedParams is empty, but we pass args
      if (expectedParams.length === 0 && call.arguments.length > 0) {
        this.report('error', `Modifier '${call.name}' takes no arguments.`, call);
        return;
      }

      // Check each argument type
      call.arguments.forEach((argVal, index) => {
        // Find expected type. If varargs or padding, let's map appropriately.
        // E.g. padding can take a Dp, or vertical/horizontal, or 4 Dps.
        const expectedType = expectedParams[index] || expectedParams[expectedParams.length - 1];
        if (expectedType) {
          this.validateArgValue(argVal, expectedType, `arg[${index}]`, `Modifier.${call.name}`);
        }
      });
    });
  }
}
