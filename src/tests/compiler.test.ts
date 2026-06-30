import { describe, it, expect, beforeEach } from 'vitest';
import { Lexer } from '../language/lexer/lexer';
import { Parser } from '../language/parser/parser';
import { Validator } from '../language/validator/validator';
import { registerDefaults } from '../language/registry/defaultRegistries';
import { generateStaticExport } from '../renderer/html/htmlRenderer';

describe('Compose Studio Compiler & Engine Pipeline', () => {
  beforeEach(() => {
    // Populate component and modifier registries
    registerDefaults();
  });

  // 1. LEXER TESTS
  describe('Lexer', () => {
    it('should tokenize basic numbers and Dp units correctly', () => {
      const lexer = new Lexer('16.dp 8.dp 12dp');
      const tokens = lexer.tokenize();
      
      const dpTokens = tokens.filter(t => t.type === 'DP');
      expect(dpTokens).toHaveLength(3);
      expect(dpTokens[0].value).toBe('16.dp');
      expect(dpTokens[1].value).toBe('8.dp');
      expect(dpTokens[2].value).toBe('12.dp'); // Normalized
    });

    it('should tokenize state variable keywords and brackets', () => {
      const code = 'val count = remember { mutableStateOf(0) }';
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe('VAL');
      expect(tokens[1].type).toBe('IDENTIFIER');
      expect(tokens[1].value).toBe('count');
      expect(tokens[2].type).toBe('EQUALS');
      expect(tokens[3].type).toBe('REMEMBER');
      expect(tokens[4].type).toBe('LBRACE');
      expect(tokens[5].type).toBe('MUTABLE_STATE_OF');
    });

    it('should strip comments out correctly', () => {
      const code = `
        // Inline comment
        Text("hello") /* block comment */
      `;
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      const comments = tokens.filter(t => t.type === 'COMMENT');
      expect(comments).toHaveLength(2);
    });
  });

  // 2. PARSER TESTS
  describe('Parser', () => {
    it('should parse nested composables and trailing lambdas', () => {
      const code = `
        Column {
          Text("Hello")
          Button(onClick = {}) {
            Text("Click")
          }
        }
      `;
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.type).toBe('Program');
      expect(ast.body).toHaveLength(1);
      
      const columnCall = ast.body[0];
      expect(columnCall.type).toBe('ComposableCall');
      expect((columnCall as any).name).toBe('Column');
      expect((columnCall as any).body).toHaveLength(2);
    });

    it('should parse conditional if statements', () => {
      const code = `
        if (showCard.value) {
          Text("Conditional Card")
        }
      `;
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.body[0].type).toBe('IfStatement');
      const ifStmt = ast.body[0] as any;
      expect(ifStmt.condition.type).toBe('PropertyAccess');
      expect(ifStmt.thenBody).toHaveLength(1);
    });
  });

  // 3. VALIDATOR TESTS
  describe('Validator', () => {
    it('should report error for unknown components', () => {
      const code = 'CustomComponent()';
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      const validator = new Validator();
      const diagnostics = validator.validate(ast);

      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].severity).toBe('error');
      expect(diagnostics[0].message).toContain("Unknown component 'CustomComponent'");
    });

    it('should report warnings for duplicate modifiers in chain', () => {
      const code = 'Text(text = "Hello", modifier = Modifier.padding(16.dp).padding(8.dp))';
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      const validator = new Validator();
      const diagnostics = validator.validate(ast);

      const warnings = diagnostics.filter(d => d.severity === 'warning');
      expect(warnings).toHaveLength(1);
      expect(warnings[0].message).toContain("Duplicate modifier 'padding'");
    });
  });

  // 4. HTML/CSS GENERATION EXPORT TESTS
  describe('HTML and CSS Export Generation', () => {
    it('should compile Column layout with background modifier into class stylesheet', () => {
      const code = `
        Column(modifier = Modifier.background(Color.Red)) {
          Text("Colored text")
        }
      `;
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      const exportResult = generateStaticExport(ast, {});
      
      expect(exportResult.html).toContain('class="c-node-1"');
      expect(exportResult.css).toContain('.c-node-1');
      expect(exportResult.css).toContain('background-color: #ef4444;');
    });

    it('should parse hex values and unary prefix negation operator', () => {
      const code = `
        val active = remember { mutableStateOf(true) }
        Column(modifier = Modifier.background(Color(0xFF0F172A))) {
          Button(onClick = { active.value = !active.value }) {
            Text("Toggle")
          }
        }
      `;
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      // Check no syntax errors
      expect(parser.diagnostics).toHaveLength(0);

      // Verify UnaryExpression parsing
      const columnNode = ast.body[1] as any;
      const buttonNode = columnNode.body[0] as any;
      const onClickArg = buttonNode.arguments[0] as any;
      const assignmentNode = onClickArg.value.body[0] as any;
      expect(assignmentNode.value.type).toBe('UnaryExpression');
      expect(assignmentNode.value.operator).toBe('!');
    });

    it('should parse and resolve named arguments in padding modifier', () => {
      const code = 'Text(text = "Hello", modifier = Modifier.padding(bottom = 24.dp, start = 8.dp))';
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(parser.diagnostics).toHaveLength(0);

      const exportResult = generateStaticExport(ast, {});
      expect(exportResult.css).toContain('padding: 0px 0px 24px 8px;');
    });

    it('should parse state delegation and loop ranges', () => {
      const code = `
        var active by remember { mutableStateOf(true) }
        Column {
          for (i in 1..3) {
            Text(text = "Item \${i}", fontSize = 16.sp)
          }
        }
      `;
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();
      
      const byToken = tokens.find(t => t.type === 'BY');
      expect(byToken).toBeDefined();

      const parser = new Parser(tokens);
      const ast = parser.parse();
      expect(parser.diagnostics).toHaveLength(0);

      const stateDecl = ast.body[0] as any;
      expect(stateDecl.isDelegated).toBe(true);

      const columnNode = ast.body[1] as any;
      const forNode = columnNode.body[0] as any;
      expect(forNode.type).toBe('For');
      expect(forNode.varName).toBe('i');
      expect(forNode.iterable.operator).toBe('..');
    });
  });
});
