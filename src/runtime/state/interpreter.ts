import type { ASTNode, LiteralNode, PropertyAccessNode } from '../../language/ast/ast';

export interface Scope {
  [key: string]: any;
}

export class Interpreter {
  private getStoreState: () => Record<string, any>;
  private setStoreState: (name: string, value: any) => void;
  private delegatedVars = new Set<string>();

  constructor(
    getStoreState: () => Record<string, any>,
    setStoreState: (name: string, value: any) => void,
    ast: any = null
  ) {
    this.getStoreState = getStoreState;
    this.setStoreState = setStoreState;
    if (ast && ast.body) {
      ast.body.forEach((node: any) => {
        if (node.type === 'StateDeclaration' && node.isDelegated) {
          this.delegatedVars.add(node.name);
        }
      });
    }
  }

  /**
   * Evaluate a given AST node under the specified local variable scope.
   */
  public evaluate(node: ASTNode, scope: Scope = {}): any {
    switch (node.type) {
      case 'Literal':
        return this.evaluateLiteral(node as LiteralNode, scope);

      case 'Identifier':
        if (node.name in scope) {
          return scope[node.name];
        }
        // Check if it exists as a remember state variable
        const stateVars = this.getStoreState();
        if (node.name in stateVars) {
          if (this.delegatedVars.has(node.name)) {
            return stateVars[node.name];
          }
          // Return a state wrapper object
          return {
            __isStateWrapper: true,
            name: node.name,
            value: stateVars[node.name],
          };
        }
        return undefined;

      case 'PropertyAccess':
        return this.evaluatePropertyAccess(node as PropertyAccessNode, scope);

      case 'UnaryExpression': {
        const val = this.evaluate((node as any).argument, scope);
        if ((node as any).operator === '!') {
          return !val;
        }
        return undefined;
      }

      case 'BinaryExpression': {
        const leftVal = this.evaluate(node.left, scope);
        const rightVal = this.evaluate(node.right, scope);
        switch (node.operator) {
          case '+':
            return leftVal + rightVal;
          case '-':
            return leftVal - rightVal;
          case '*':
            return leftVal * rightVal;
          case '/':
            return leftVal / rightVal;
          case '==':
            return leftVal == rightVal;
          case '..': {
            const range: number[] = [];
            const start = Number(leftVal);
            const end = Number(rightVal);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = start; i <= end; i++) {
                range.push(i);
              }
            }
            return range;
          }
          default:
            return undefined;
        }
      }

      case 'For': {
        const iterable = this.evaluate((node as any).iterable, scope);
        const results: any[] = [];
        if (Array.isArray(iterable)) {
          iterable.forEach((item: any) => {
            const childScope = { ...scope };
            childScope[(node as any).varName] = item;
            (node as any).body.forEach((stmt: any) => {
              const res = this.evaluate(stmt, childScope);
              if (res !== undefined) {
                results.push(res);
              }
            });
          });
        }
        return results;
      }

      case 'Assignment': {
        const val = this.evaluate(node.value, scope);
        this.executeAssignment(node.target, val, scope);
        return val;
      }

      case 'Lambda': {
        // Return a JS callback function
        return (...args: any[]) => {
          const childScope = { ...scope };
          // Map parameters to arguments
          node.params.forEach((param, index) => {
            childScope[param] = args[index];
          });
          // If no parameters are declared, but we pass arguments, map to 'it' (Compose standard)
          if (node.params.length === 0 && args.length > 0) {
            childScope['it'] = args[0];
          }

          // Execute statements in lambda body
          let lastResult: any;
          node.body.forEach(stmt => {
            lastResult = this.evaluate(stmt, childScope);
          });
          return lastResult;
        };
      }

      case 'ModifierChain':
        // Evaluates to itself so the renderer can inspect it
        return node;

      default:
        return undefined;
    }
  }

  private evaluateLiteral(node: LiteralNode, scope: Scope): any {
    const rawVal = node.value;
    if (node.literalType === 'string' && typeof rawVal === 'string') {
      // Evaluate string interpolation: e.g. "Clicks: ${count.value}"
      return this.interpolateString(rawVal, scope);
    }
    return rawVal;
  }

  private evaluatePropertyAccess(node: PropertyAccessNode, scope: Scope): any {
    const obj = this.evaluate(node.object, scope);
    if (!obj) return undefined;

    // Check if the object is a remember state wrapper
    if (obj.__isStateWrapper && node.property === 'value') {
      return obj.value;
    }

    return obj[node.property];
  }

  private executeAssignment(target: string, value: any, scope: Scope): void {
    if (target.endsWith('.value')) {
      const stateName = target.substring(0, target.length - 6);
      this.setStoreState(stateName, value);
    } else {
      if (target in scope) {
        scope[target] = value;
      } else {
        const stateVars = this.getStoreState();
        if (target in stateVars || this.delegatedVars.has(target)) {
          this.setStoreState(target, value);
        } else {
          scope[target] = value;
        }
      }
    }
  }

  /**
   * String interpolation parser
   * Looks for ${expression} in string and evaluates it
   */
  private interpolateString(str: string, scope: Scope): string {
    const regex = /\$\{([^}]+)\}/g;
    return str.replace(regex, (match, expressionStr) => {
      // We parse the expressionStr on the fly.
      // Since it's usually something simple like count.value or count.value + 1,
      // let's do a simple lookup. If it's count.value, look up state.
      const stateVars = this.getStoreState();
      
      // Let's do a basic parser helper for string interpolations.
      // E.g. count.value -> lookup count
      const trimmed = expressionStr.trim();
      if (trimmed.endsWith('.value')) {
        const varName = trimmed.slice(0, -6);
        if (varName in stateVars) {
          return String(stateVars[varName]);
        }
        if (varName in scope) {
          return String(scope[varName]?.value ?? scope[varName]);
        }
      }
      
      if (trimmed in scope) {
        return String(scope[trimmed]);
      }
      if (trimmed in stateVars) {
        return String(stateVars[trimmed]);
      }
      
      // Fallback
      return match;
    });
  }
}
