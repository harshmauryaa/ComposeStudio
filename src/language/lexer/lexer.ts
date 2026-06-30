export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'FLOAT'
  | 'DP'
  | 'SP'
  | 'BOOLEAN'
  | 'DOT'
  | 'COMMA'
  | 'EQUALS'
  | 'LBRACE'
  | 'RBRACE'
  | 'LPAREN'
  | 'RPAREN'
  | 'ARROW'
  | 'VAL'
  | 'REMEMBER'
  | 'MUTABLE_STATE_OF'
  | 'BY'
  | 'FOR'
  | 'IN'
  | 'RANGE'
  | 'IMPORT'
  | 'COMMENT'
  | 'EOF'
  | 'UNKNOWN';

export interface SourcePosition {
  line: number;
  column: number;
  offset: number;
}

export interface SourceRange {
  start: SourcePosition;
  end: SourcePosition;
}

export interface Token {
  type: TokenType;
  value: string;
  range: SourceRange;
}

export class Lexer {
  private source: string;
  private offset: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  private peek(offset: number = 0): string {
    if (this.offset + offset >= this.source.length) {
      return '';
    }
    return this.source[this.offset + offset];
  }

  private advance(): string {
    const char = this.peek();
    this.offset++;
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private getPosition(): SourcePosition {
    return {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
  }

  private matchString(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      if (this.peek(i) !== str[i]) return false;
    }
    return true;
  }

  private advanceLength(len: number) {
    for (let i = 0; i < len; i++) {
      this.advance();
    }
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.offset < this.source.length) {
      const char = this.peek();

      // Whitespace
      if (/\s/.test(char)) {
        this.advance();
        continue;
      }

      const startPos = this.getPosition();

      // Single line comments
      if (char === '/' && this.peek(1) === '/') {
        this.advanceLength(2);
        let value = '';
        while (this.peek() !== '\n' && this.peek() !== '') {
          value += this.advance();
        }
        tokens.push({
          type: 'COMMENT',
          value,
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      // Block comments
      if (char === '/' && this.peek(1) === '*') {
        this.advanceLength(2);
        let value = '';
        while (!(this.peek() === '*' && this.peek(1) === '/') && this.peek() !== '') {
          value += this.advance();
        }
        if (this.peek() === '*') {
          this.advanceLength(2);
        }
        tokens.push({
          type: 'COMMENT',
          value,
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      // Punctuation & Operators
      if (char === '-' && this.peek(1) === '>') {
        this.advanceLength(2);
        tokens.push({
          type: 'ARROW',
          value: '->',
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      if (char === '.') {
        if (this.peek(1) === '.') {
          this.advanceLength(2); // consume both dots '..'
          tokens.push({
            type: 'RANGE',
            value: '..',
            range: { start: startPos, end: this.getPosition() },
          });
          continue;
        }
        this.advance();
        tokens.push({
          type: 'DOT',
          value: '.',
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      if (char === ',') {
        this.advance();
        tokens.push({
          type: 'COMMA',
          value: ',',
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      if (char === '=') {
        this.advance();
        tokens.push({
          type: 'EQUALS',
          value: '=',
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      if (char === '{') {
        this.advance();
        tokens.push({
          type: 'LBRACE',
          value: '{',
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      if (char === '}') {
        this.advance();
        tokens.push({
          type: 'RBRACE',
          value: '}',
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      if (char === '(') {
        this.advance();
        tokens.push({
          type: 'LPAREN',
          value: '(',
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      if (char === ')') {
        this.advance();
        tokens.push({
          type: 'RPAREN',
          value: ')',
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      // Strings
      if (char === '"') {
        this.advance(); // consume opening quote
        let value = '';
        while (this.peek() !== '"' && this.peek() !== '') {
          if (this.peek() === '\\') {
            value += this.advance(); // consume backslash
            value += this.advance(); // consume escaped char
          } else {
            value += this.advance();
          }
        }
        if (this.peek() === '"') {
          this.advance(); // consume closing quote
        }
        tokens.push({
          type: 'STRING',
          value,
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      // Numbers, Floats, Dp, Hex
      if (/[0-9]/.test(char)) {
        let value = '';

        // Check if it is a hexadecimal color or number: e.g., 0xFF123456
        if (char === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
          value += this.advance(); // consume '0'
          value += this.advance(); // consume 'x'
          while (/[0-9a-fA-F]/.test(this.peek())) {
            value += this.advance();
          }
          tokens.push({
            type: 'NUMBER',
            value,
            range: { start: startPos, end: this.getPosition() },
          });
          continue;
        }

        // read digits
        while (/[0-9]/.test(this.peek())) {
          value += this.advance();
        }

        // Check if there is a decimal point
        if (this.peek() === '.' && /[0-9]/.test(this.peek(1))) {
          value += this.advance(); // consume dot
          while (/[0-9]/.test(this.peek())) {
            value += this.advance();
          }
        }

        // Check if it's a Dp: e.g., 16.dp or 16.5.dp or 16dp
        if (this.peek() === '.' && this.peek(1) === 'd' && this.peek(2) === 'p') {
          this.advanceLength(3); // consume .dp
          value += '.dp';
          tokens.push({
            type: 'DP',
            value,
            range: { start: startPos, end: this.getPosition() },
          });
          continue;
        }

        if (this.peek() === 'd' && this.peek(1) === 'p') {
          this.advanceLength(2); // consume dp
          value += '.dp'; // normalized as .dp for AST
          tokens.push({
            type: 'DP',
            value,
            range: { start: startPos, end: this.getPosition() },
          });
          continue;
        }

        // Check if it's a Sp: e.g. 16.sp or 16.5.sp or 16sp
        if (this.peek() === '.' && this.peek(1) === 's' && this.peek(2) === 'p') {
          this.advanceLength(3); // consume .sp
          value += '.sp';
          tokens.push({
            type: 'SP',
            value,
            range: { start: startPos, end: this.getPosition() },
          });
          continue;
        }

        if (this.peek() === 's' && this.peek(1) === 'p') {
          this.advanceLength(2); // consume sp
          value += '.sp'; // normalized as .sp for AST
          tokens.push({
            type: 'SP',
            value,
            range: { start: startPos, end: this.getPosition() },
          });
          continue;
        }

        // Check if it's a Float: e.g. 1.5f, 1f
        if (this.peek() === 'f' || this.peek() === 'F') {
          this.advance(); // consume f
          value += 'f';
          tokens.push({
            type: 'FLOAT',
            value,
            range: { start: startPos, end: this.getPosition() },
          });
          continue;
        }

        // Just regular number
        tokens.push({
          type: 'NUMBER',
          value,
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      // Identifiers & Keywords
      if (/[a-zA-Z_]/.test(char)) {
        let value = '';
        while (/[a-zA-Z0-9_]/.test(this.peek())) {
          value += this.advance();
        }

        let type: TokenType = 'IDENTIFIER';
        if (value === 'val' || value === 'var') type = 'VAL';
        else if (value === 'remember') type = 'REMEMBER';
        else if (value === 'mutableStateOf') type = 'MUTABLE_STATE_OF';
        else if (value === 'by') type = 'BY';
        else if (value === 'for') type = 'FOR';
        else if (value === 'in') type = 'IN';
        else if (value === 'import') type = 'IMPORT';
        else if (value === 'true' || value === 'false') type = 'BOOLEAN';

        tokens.push({
          type,
          value,
          range: { start: startPos, end: this.getPosition() },
        });
        continue;
      }

      // Fallback for UNKNOWN characters
      const rawChar = this.advance();
      tokens.push({
        type: 'UNKNOWN',
        value: rawChar,
        range: { start: startPos, end: this.getPosition() },
      });
    }

    // Add EOF token
    const eofPos = this.getPosition();
    tokens.push({
      type: 'EOF',
      value: '',
      range: { start: eofPos, end: eofPos },
    });

    return tokens;
  }
}
