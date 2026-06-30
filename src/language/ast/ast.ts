import type { SourceRange } from '../lexer/lexer';

export type ASTNodeType =
  | 'Program'
  | 'StateDeclaration'
  | 'ComposableCall'
  | 'Argument'
  | 'Literal'
  | 'ModifierChain'
  | 'ModifierCall'
  | 'Lambda'
  | 'Assignment'
  | 'BinaryExpression'
  | 'PropertyAccess'
  | 'Identifier'
  | 'IfStatement'
  | 'UnaryExpression'
  | 'For'
  | 'ErrorNode';

export interface BaseASTNode {
  id: string; // Unique id for React key mapping & inspection
  type: ASTNodeType;
  range: SourceRange;
}

export interface ProgramNode extends BaseASTNode {
  type: 'Program';
  body: ASTNode[];
}

export interface StateDeclarationNode extends BaseASTNode {
  type: 'StateDeclaration';
  name: string;
  defaultValue: LiteralNode;
  isDelegated: boolean; // declared with "by" delegate
}

export interface ComposableCallNode extends BaseASTNode {
  type: 'ComposableCall';
  name: string;
  arguments: ArgumentNode[];
  hasBody: boolean;
  body: ASTNode[];
}

export interface IfStatementNode extends BaseASTNode {
  type: 'IfStatement';
  condition: ASTNode;
  thenBody: ASTNode[];
  elseBody?: ASTNode[];
}

export interface UnaryExpressionNode extends BaseASTNode {
  type: 'UnaryExpression';
  operator: '!';
  argument: ASTNode;
}

export interface ArgumentNode extends BaseASTNode {
  type: 'Argument';
  name?: string; // e.g., 'modifier = ...'
  value: ASTNode;
}

export interface LiteralNode extends BaseASTNode {
  type: 'Literal';
  literalType: 'string' | 'number' | 'float' | 'dp' | 'sp' | 'color' | 'enum' | 'boolean';
  value: any; // Raw parsed JS equivalent
}

export interface ForStatementNode extends BaseASTNode {
  type: 'For';
  varName: string;
  iterable: ASTNode;
  body: ASTNode[];
}

export interface ModifierChainNode extends BaseASTNode {
  type: 'ModifierChain';
  calls: ModifierCallNode[];
}

export interface ModifierCallNode extends BaseASTNode {
  type: 'ModifierCall';
  name: string;
  arguments: ASTNode[];
}

export interface LambdaNode extends BaseASTNode {
  type: 'Lambda';
  params: string[]; // e.g., ['it']
  body: ASTNode[];
}

export interface AssignmentNode extends BaseASTNode {
  type: 'Assignment';
  target: string; // e.g. "count.value"
  value: ASTNode;
}

export interface BinaryExpressionNode extends BaseASTNode {
  type: 'BinaryExpression';
  operator: '+' | '-' | '*' | '/' | '==' | '..';
  left: ASTNode;
  right: ASTNode;
}

export interface PropertyAccessNode extends BaseASTNode {
  type: 'PropertyAccess';
  object: ASTNode; // e.g. Identifier
  property: string; // e.g. "value"
}

export interface IdentifierNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
}

export interface ErrorNode extends BaseASTNode {
  type: 'ErrorNode';
  message: string;
}

export type ASTNode =
  | ProgramNode
  | StateDeclarationNode
  | ComposableCallNode
  | IfStatementNode
  | UnaryExpressionNode
  | ForStatementNode
  | ArgumentNode
  | LiteralNode
  | ModifierChainNode
  | ModifierCallNode
  | LambdaNode
  | AssignmentNode
  | BinaryExpressionNode
  | PropertyAccessNode
  | IdentifierNode
  | ErrorNode;

let nodeIdCounter = 0;
export function generateNodeId(): string {
  return `ast-node-${++nodeIdCounter}-${Math.random().toString(36).substr(2, 9)}`;
}
