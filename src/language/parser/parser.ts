import type { Token, TokenType, SourceRange, SourcePosition } from '../lexer/lexer';
import { generateNodeId } from '../ast/ast';
import type {
  ASTNode,
  ProgramNode,
  StateDeclarationNode,
  ComposableCallNode,
  IfStatementNode,
  UnaryExpressionNode,
  ForStatementNode,
  ArgumentNode,
  LiteralNode,
  ModifierChainNode,
  ModifierCallNode,
  AssignmentNode,
  BinaryExpressionNode,
  PropertyAccessNode,
} from '../ast/ast';

export interface Diagnostic {
  severity: 'error' | 'warning';
  message: string;
  line: number;
  column: number;
  startOffset: number;
  endOffset: number;
  fixSuggestion?: string;
}

export class Parser {
  private tokens: Token[];
  private cursor: number = 0;
  public diagnostics: Diagnostic[] = [];

  constructor(tokens: Token[]) {
    // Filter out comments from standard compilation parsing
    // but keep a record if needed.
    this.tokens = tokens.filter(t => t.type !== 'COMMENT');
  }

  private peek(offset: number = 0): Token {
    const idx = this.cursor + offset;
    if (idx >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // Return EOF
    }
    return this.tokens[idx];
  }

  private peekType(offset: number = 0): TokenType {
    return this.peek(offset).type;
  }

  private advance(): Token {
    const token = this.peek();
    if (token.type !== 'EOF') {
      this.cursor++;
    }
    return token;
  }

  private match(type: TokenType): boolean {
    if (this.peekType() === type) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: TokenType, errorMessage: string): Token {
    const token = this.peek();
    if (token.type === type) {
      return this.advance();
    }
    
    this.reportError(errorMessage, token.range);
    
    // Return dummy token or EOF to avoid crash
    return {
      type,
      value: '',
      range: token.range,
    };
  }

  private reportError(message: string, range: SourceRange, fixSuggestion?: string) {
    this.diagnostics.push({
      severity: 'error',
      message,
      line: range.start.line,
      column: range.start.column,
      startOffset: range.start.offset,
      endOffset: range.end.offset,
      fixSuggestion,
    });
  }

  public parse(): ProgramNode {
    this.diagnostics = [];
    this.cursor = 0;
    
    const startPos = this.peek().range.start;
    const body: ASTNode[] = [];

    while (this.peekType() !== 'EOF') {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        }
      } catch (e) {
        // Recovery logic: skip to next recoverable point
        this.recover();
      }
    }

    const endPos = this.peek().range.end;

    return {
      id: generateNodeId(),
      type: 'Program',
      body,
      range: { start: startPos, end: endPos },
    };
  }

  private recover() {
    // Advance until we see 'val', or an uppercase identifier, or a closing brace, or EOF
    while (this.peekType() !== 'EOF') {
      const nextType = this.peekType();
      if (nextType === 'VAL' || nextType === 'RBRACE') {
        break;
      }
      if (nextType === 'IDENTIFIER') {
        const value = this.peek().value;
        if (value && value[0] === value[0].toUpperCase()) {
          break;
        }
      }
      this.advance();
    }
  }

  private parseStatement(): ASTNode {
    const startToken = this.peek();

    if (this.peekType() === 'VAL') {
      return this.parseStateDeclaration();
    }

    if (this.peekType() === 'FOR') {
      return this.parseForStatement();
    }

    if (this.peekType() === 'IDENTIFIER') {
      // Check if it's an 'if' statement
      if (startToken.value === 'if') {
        return this.parseIfStatement();
      }

      // Check if it's an assignment like "count.value = count.value + 1"
      // or "count = 5"
      const isAssignment =
        this.peekType(1) === 'EQUALS' ||
        (this.peekType(1) === 'DOT' && this.peekType(2) === 'IDENTIFIER' && this.peekType(3) === 'EQUALS');

      if (isAssignment) {
        return this.parseAssignment();
      }

      // Check if it's a Composable Call
      const value = startToken.value;
      const isUppercase = value && value[0] === value[0].toUpperCase();
      
      if (isUppercase) {
        return this.parseComposableCall();
      }
    }

    // Default: parse as expression
    return this.parseExpression();
  }

  private parseIfStatement(): IfStatementNode {
    const startToken = this.expect('IDENTIFIER', "Expected 'if'");
    const startPos = startToken.range.start;

    this.expect('LPAREN', "Expected '(' after 'if'");
    const condition = this.parseExpression();
    this.expect('RPAREN', "Expected ')' after condition");

    this.expect('LBRACE', "Expected '{' for then block");
    const thenBody: ASTNode[] = [];
    while (this.peekType() !== 'RBRACE' && this.peekType() !== 'EOF') {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          thenBody.push(stmt);
        }
      } catch (e) {
        this.recover();
      }
    }
    this.expect('RBRACE', "Expected '}' to close then block");

    let elseBody: ASTNode[] | undefined = undefined;

    // Optional else block
    if (this.peekType() === 'IDENTIFIER' && this.peek().value === 'else') {
      this.advance(); // consume 'else'
      this.expect('LBRACE', "Expected '{' for else block");
      elseBody = [];
      while (this.peekType() !== 'RBRACE' && this.peekType() !== 'EOF') {
        try {
          const stmt = this.parseStatement();
          if (stmt) {
            elseBody.push(stmt);
          }
        } catch (e) {
          this.recover();
        }
      }
      this.expect('RBRACE', "Expected '}' to close else block");
    }

    const endPos = this.peek().range.start;

    return {
      id: generateNodeId(),
      type: 'IfStatement',
      condition,
      thenBody,
      elseBody,
      range: { start: startPos, end: endPos },
    };
  }

  // Parses: val/var count [= / by] remember { mutableStateOf(0) }
  private parseStateDeclaration(): StateDeclarationNode {
    const startToken = this.expect('VAL', "Expected 'val' or 'var' to start state declaration");
    const nameToken = this.expect('IDENTIFIER', "Expected variable name");
    
    let isDelegated = false;
    if (this.peekType() === 'BY') {
      this.advance(); // consume 'by'
      isDelegated = true;
    } else {
      this.expect('EQUALS', "Expected '=' or 'by' after variable name");
    }

    this.expect('REMEMBER', "Expected 'remember' function call");
    
    this.expect('LBRACE', "Expected '{' for remember block");
    this.expect('MUTABLE_STATE_OF', "Expected 'mutableStateOf' call");
    
    this.expect('LPAREN', "Expected '(' after 'mutableStateOf'");
    const defaultValue = this.parseLiteral();
    this.expect('RPAREN', "Expected ')' after default state value");
    
    this.expect('RBRACE', "Expected '}' to close remember block");

    const endToken = this.peek();

    return {
      id: generateNodeId(),
      type: 'StateDeclaration',
      name: nameToken.value,
      defaultValue,
      isDelegated,
      range: { start: startToken.range.start, end: endToken.range.start },
    };
  }

  // Parses: Text("Hello") or Text(text = "Hello")
  private parseComposableCall(): ComposableCallNode {
    const nameToken = this.expect('IDENTIFIER', 'Expected Composable name');
    const name = nameToken.value;
    const startPos = nameToken.range.start;

    let args: ArgumentNode[] = [];
    let hasBody = false;
    let body: ASTNode[] = [];

    // Parse optional arguments inside (...)
    if (this.match('LPAREN')) {
      args = this.parseArgumentList();
      this.expect('RPAREN', "Expected ')' after arguments");
    }

    // Parse optional trailing lambda inside {...}
    if (this.peekType() === 'LBRACE') {
      hasBody = true;
      this.advance(); // consume '{'
      
      while (this.peekType() !== 'RBRACE' && this.peekType() !== 'EOF') {
        try {
          const stmt = this.parseStatement();
          if (stmt) {
            body.push(stmt);
          }
        } catch (e) {
          this.recover();
        }
      }
      
      this.expect('RBRACE', "Expected '}' to close composable body");
    }

    const endPos = this.peek().range.start;

    return {
      id: generateNodeId(),
      type: 'ComposableCall',
      name,
      arguments: args,
      hasBody,
      body,
      range: { start: startPos, end: endPos },
    };
  }

  private parseArgumentList(): ArgumentNode[] {
    const args: ArgumentNode[] = [];

    if (this.peekType() === 'RPAREN') {
      return args;
    }

    args.push(this.parseArgument());

    while (this.match('COMMA')) {
      if (this.peekType() === 'RPAREN') {
        break; // Trailing comma
      }
      args.push(this.parseArgument());
    }

    return args;
  }

  private parseArgument(): ArgumentNode {
    const startPos = this.peek().range.start;
    
    // Check if it is a named argument: identifier = expression
    if (this.peekType() === 'IDENTIFIER' && this.peekType(1) === 'EQUALS') {
      const nameToken = this.advance();
      this.advance(); // consume '='
      const val = this.parseExpression();
      
      return {
        id: generateNodeId(),
        type: 'Argument',
        name: nameToken.value,
        value: val,
        range: { start: startPos, end: val.range.end },
      };
    }

    // Positional argument
    const val = this.parseExpression();
    return {
      id: generateNodeId(),
      type: 'Argument',
      value: val,
      range: { start: startPos, end: val.range.end },
    };
  }

  private parseAssignment(): AssignmentNode {
    const startPos = this.peek().range.start;
    
    // E.g. count = expression or count.value = expression
    const targetObjToken = this.expect('IDENTIFIER', 'Expected target variable name for assignment');
    let target = targetObjToken.value;

    if (this.match('DOT')) {
      const propToken = this.expect('IDENTIFIER', 'Expected property name after dot');
      target += `.${propToken.value}`;
    }

    this.expect('EQUALS', "Expected '=' in assignment");
    const val = this.parseExpression();

    return {
      id: generateNodeId(),
      type: 'Assignment',
      target,
      value: val,
      range: { start: startPos, end: val.range.end },
    };
  }

  private parseExpression(): ASTNode {
    return this.parseBinaryExpression();
  }

  private parseBinaryExpression(): ASTNode {
    let left = this.parsePrimaryExpression();

    // Check if next token is a binary operator
    while (
      this.peek().value === '+' ||
      this.peek().value === '-' ||
      this.peek().value === '*' ||
      this.peek().value === '/' ||
      this.peek().value === '==' ||
      this.peek().value === '..'
    ) {
      // It's a binary operator!
      const opToken = this.advance();
      const operator = opToken.value as any;
      const right = this.parsePrimaryExpression();

      const startPos = left.range.start;
      left = {
        id: generateNodeId(),
        type: 'BinaryExpression',
        operator,
        left,
        right,
        range: { start: startPos, end: right.range.end },
      } as BinaryExpressionNode;
    }

    return left;
  }

  private parsePrimaryExpression(): ASTNode {
    const startToken = this.peek();
    const startPos = startToken.range.start;

    // Check prefix logical NOT operator: !
    if (startToken.value === '!') {
      this.advance(); // consume '!'
      const argument = this.parsePrimaryExpression();
      return {
        id: generateNodeId(),
        type: 'UnaryExpression',
        operator: '!',
        argument,
        range: { start: startPos, end: argument.range.end },
      } as UnaryExpressionNode;
    }

    // Check Literals
    if (
      startToken.type === 'STRING' ||
      startToken.type === 'NUMBER' ||
      startToken.type === 'FLOAT' ||
      startToken.type === 'DP' ||
      startToken.type === 'SP' ||
      startToken.type === 'BOOLEAN'
    ) {
      return this.parseLiteral();
    }

    // Check lambdas starting with {
    if (this.peekType() === 'LBRACE') {
      this.advance(); // consume '{'
      
      // Check for parameter signature: it -> or parameters ->
      let params: string[] = [];
      if (this.peekType() === 'IDENTIFIER' && this.peekType(1) === 'ARROW') {
        params.push(this.advance().value);
        this.advance(); // consume ->
      } else if (this.peekType() === 'IDENTIFIER' && this.peekType(1) === 'COMMA') {
        // multiple params could be parsed, let's keep it simple
        while (this.peekType() === 'IDENTIFIER') {
          params.push(this.advance().value);
          this.match('COMMA');
        }
        this.expect('ARROW', "Expected '->' after lambda parameters");
      }

      const body: ASTNode[] = [];
      while (this.peekType() !== 'RBRACE' && this.peekType() !== 'EOF') {
        try {
          body.push(this.parseStatement());
        } catch (e) {
          this.recover();
        }
      }
      this.expect('RBRACE', "Expected '}' at the end of lambda");
      const endPos = this.peek().range.start;

      return {
        id: generateNodeId(),
        type: 'Lambda',
        params,
        body,
        range: { start: startPos, end: endPos },
      };
    }

    // Check Modifier or Identifier
    if (startToken.type === 'IDENTIFIER') {
      const name = startToken.value;

      // Check if it is "Modifier"
      if (name === 'Modifier') {
        return this.parseModifierChain();
      }

      // Check if it is a Color literal
      if (name === 'Color') {
        // e.g. Color.Red or Color(0xFF00FF00)
        this.advance(); // consume "Color"
        if (this.match('DOT')) {
          const colorName = this.expect('IDENTIFIER', 'Expected color name (e.g. Red, Blue)');
          const endPos = colorName.range.end;
          return {
            id: generateNodeId(),
            type: 'Literal',
            literalType: 'color',
            value: `Color.${colorName.value}`,
            range: { start: startPos, end: endPos },
          };
        } else if (this.match('LPAREN')) {
          const colorValToken = this.advance(); // number or hex
          this.expect('RPAREN', "Expected ')' after color code");
          const endPos = this.peek().range.start;
          return {
            id: generateNodeId(),
            type: 'Literal',
            literalType: 'color',
            value: `Color(${colorValToken.value})`,
            range: { start: startPos, end: endPos },
          };
        }
      }

      // Check if it is an Enum: Alignment.Center, Arrangement.Center, FontWeight.Bold, TextAlign.Center, FontStyle.Italic, TextDecoration.Underline
      if (
        name === 'Alignment' ||
        name === 'Arrangement' ||
        name === 'FontWeight' ||
        name === 'TextAlign' ||
        name === 'FontStyle' ||
        name === 'TextDecoration'
      ) {
        this.advance(); // consume identifier
        this.expect('DOT', "Expected '.' in enum reference");
        const enumMember = this.expect('IDENTIFIER', 'Expected enum value');
        const endPos = enumMember.range.end;
        return {
          id: generateNodeId(),
          type: 'Literal',
          literalType: 'enum',
          value: `${name}.${enumMember.value}`,
          range: { start: startPos, end: endPos },
        };
      }

      // Standalone identifier reference (e.g., variable like count, it)
      this.advance(); // consume identifier
      let node: ASTNode = {
        id: generateNodeId(),
        type: 'Identifier',
        name,
        range: { start: startPos, end: startToken.range.end },
      };

      // Property access check: e.g. count.value
      while (this.match('DOT')) {
        const propToken = this.expect('IDENTIFIER', 'Expected property name after dot');
        node = {
          id: generateNodeId(),
          type: 'PropertyAccess',
          object: node,
          property: propToken.value,
          range: { start: startPos, end: propToken.range.end },
        } as PropertyAccessNode;
      }

      return node;
    }

    // If it's an error
    const errorToken = this.advance();
    this.reportError(`Unexpected token: '${errorToken.value || errorToken.type}'`, errorToken.range);
    return {
      id: generateNodeId(),
      type: 'ErrorNode',
      message: `Unexpected token '${errorToken.value || errorToken.type}'`,
      range: errorToken.range,
    };
  }

  private parseLiteral(): LiteralNode {
    const token = this.advance();
    const startPos = token.range.start;
    const endPos = token.range.end;

    let value: any;
    let literalType: LiteralNode['literalType'];

    switch (token.type) {
      case 'STRING':
        value = token.value;
        literalType = 'string';
        break;
      case 'NUMBER':
        // parse as float or int
        value = Number(token.value);
        literalType = 'number';
        break;
      case 'FLOAT':
        value = parseFloat(token.value.replace(/[fF]/g, ''));
        literalType = 'float';
        break;
      case 'DP':
        value = parseFloat(token.value.replace('.dp', ''));
        literalType = 'dp';
        break;
      case 'SP':
        value = parseFloat(token.value.replace('.sp', ''));
        literalType = 'sp';
        break;
      case 'BOOLEAN':
        value = token.value === 'true';
        literalType = 'boolean';
        break;
      default:
        this.reportError(`Invalid literal token: ${token.type}`, token.range);
        value = token.value;
        literalType = 'string';
    }

    return {
      id: generateNodeId(),
      type: 'Literal',
      literalType,
      value,
      range: { start: startPos, end: endPos },
    };
  }

  // Parses: Modifier.padding(16.dp).fillMaxWidth()
  private parseModifierChain(): ModifierChainNode {
    const startToken = this.expect('IDENTIFIER', "Expected 'Modifier'");
    const startPos = startToken.range.start;
    const calls: ModifierCallNode[] = [];

    while (this.match('DOT')) {
      const callStart = this.peek().range.start;
      const modifierNameToken = this.expect('IDENTIFIER', 'Expected modifier function name');
      const name = modifierNameToken.value;
      const args: ASTNode[] = [];

      // Modifiers can optionally have parenthesis, e.g. .fillMaxWidth() or .padding(16.dp)
      if (this.match('LPAREN')) {
        if (this.peekType() !== 'RPAREN') {
          args.push(this.parseArgument());
          while (this.match('COMMA')) {
            args.push(this.parseArgument());
          }
        }
        this.expect('RPAREN', "Expected ')' after modifier arguments");
      }

      // Check for trailing lambda inside modifier, e.g. clickable { count.value++ }
      if (this.peekType() === 'LBRACE') {
        args.push(this.parseExpression()); // parses trailing lambda as a LambdaNode
      }

      const callEnd = this.peek().range.start;
      calls.push({
        id: generateNodeId(),
        type: 'ModifierCall',
        name,
        arguments: args,
        range: { start: callStart, end: callEnd },
      });
    }

    const endPos = this.peek().range.start;

    return {
      id: generateNodeId(),
      type: 'ModifierChain',
      calls,
      range: { start: startPos, end: endPos },
    };
  }

  // Parses: for (i in 1..5) { ... }
  private parseForStatement(): ForStatementNode {
    const startToken = this.expect('FOR', "Expected 'for' to start loop");
    this.expect('LPAREN', "Expected '(' after 'for'");
    
    const varNameToken = this.expect('IDENTIFIER', "Expected loop variable name");
    const varName = varNameToken.value;
    
    this.expect('IN', "Expected 'in' after loop variable");
    
    const iterable = this.parseExpression();
    
    this.expect('RPAREN', "Expected ')' after loop definition");
    this.expect('LBRACE', "Expected '{' to open loop body");
    
    const body: ASTNode[] = [];
    while (this.peekType() !== 'RBRACE' && this.peekType() !== 'EOF') {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        }
      } catch (e) {
        this.recover();
      }
    }
    
    this.expect('RBRACE', "Expected '}' to close loop body");
    const endToken = this.peek();
    
    return {
      id: generateNodeId(),
      type: 'For',
      varName,
      iterable,
      body,
      range: { start: startToken.range.start, end: endToken.range.start },
    };
  }
}
