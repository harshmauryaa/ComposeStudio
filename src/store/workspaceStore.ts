import { create } from 'zustand';
import { Lexer } from '../language/lexer/lexer';
import { Parser } from '../language/parser/parser';
import type { Diagnostic } from '../language/parser/parser';
import { Validator } from '../language/validator/validator';
import type { ProgramNode } from '../language/ast/ast';
import { registerDefaults } from '../language/registry/defaultRegistries';

// Ensure components and modifiers are registered before initial code compilation runs
registerDefaults();

export interface WorkspaceStore {
  code: string;
  ast: ProgramNode | null;
  diagnostics: Diagnostic[];
  runtimeState: Record<string, any>;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  inspectMode: boolean;
  consoleLogs: string[];
  
  // Actions
  setCode: (code: string) => void;
  setRuntimeStateVal: (name: string, value: any) => void;
  resetRuntimeState: () => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setHoveredNodeId: (nodeId: string | null) => void;
  setInspectMode: (enabled: boolean) => void;
  clearConsole: () => void;
  addConsoleLog: (message: string) => void;
}

const DEFAULT_CODE = `val isDark = remember { mutableStateOf(false) }
val count = remember { mutableStateOf(0) }

if (isDark.value) {
    MaterialTheme(theme = "dark") {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Counter Demo",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.weight(1.0f))
                    Switch(
                        checked = isDark.value,
                        onCheckedChange = { isDark.value = it }
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(
                            text = "CURRENT VALUE",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "\${count.value}",
                            style = MaterialTheme.typography.displayLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Row {
                            Button(onClick = { count.value = count.value - 1 }) {
                                Text(text = "Decrement")
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Button(onClick = { count.value = count.value + 1 }) {
                                Text(text = "Increment")
                            }
                        }
                    }
                }
            }
        }
    }
}

if (!isDark.value) {
    MaterialTheme(theme = "light") {
        Surface(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Counter Demo",
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.weight(1.0f))
                    Switch(
                        checked = isDark.value,
                        onCheckedChange = { isDark.value = it }
                    )
                }

                Spacer(modifier = Modifier.height(32.dp))

                Card(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text(
                            text = "CURRENT VALUE",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "\${count.value}",
                            style = MaterialTheme.typography.displayLarge,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Row {
                            Button(onClick = { count.value = count.value - 1 }) {
                                Text(text = "Decrement")
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Button(onClick = { count.value = count.value + 1 }) {
                                Text(text = "Increment")
                            }
                        }
                    }
                }
            }
        }
    }
}
`;

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => {
  // Parsing and Validation compilation function
  const compile = (code: string, currentRuntimeState: Record<string, any>) => {
    try {
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      const parser = new Parser(tokens);
      const ast = parser.parse();

      const validator = new Validator();
      const validationDiagnostics = validator.validate(ast);
      
      const allDiagnostics = [...parser.diagnostics, ...validationDiagnostics];

      // Extract current state declarations to synchronize Zustand runtimeState
      const nextRuntimeState = { ...currentRuntimeState };
      const declaredStateVars = new Set<string>();

      ast.body.forEach(node => {
        if (node.type === 'StateDeclaration') {
          declaredStateVars.add(node.name);
          // If the variable isn't initialized yet, initialize it
          if (!(node.name in nextRuntimeState)) {
            nextRuntimeState[node.name] = node.defaultValue.value;
          }
        }
      });

      // Prune state variables that were deleted from code
      Object.keys(nextRuntimeState).forEach(key => {
        if (!declaredStateVars.has(key)) {
          delete nextRuntimeState[key];
        }
      });

      return {
        ast,
        diagnostics: allDiagnostics,
        runtimeState: nextRuntimeState,
      };
    } catch (e: any) {
      console.error(e);
      return {
        ast: null,
        diagnostics: [
          {
            severity: 'error' as const,
            message: `Engine Crash: ${e.message || e}`,
            line: 1,
            column: 1,
            startOffset: 0,
            endOffset: code.length,
          },
        ],
        runtimeState: currentRuntimeState,
      };
    }
  };

  // Compile the initial code
  const initialCompile = compile(DEFAULT_CODE, {});

  return {
    code: DEFAULT_CODE,
    ast: initialCompile.ast,
    diagnostics: initialCompile.diagnostics,
    runtimeState: initialCompile.runtimeState,
    selectedNodeId: null,
    hoveredNodeId: null,
    inspectMode: false,
    consoleLogs: ['[Console Initialized] Write event handlers to trace log outputs.'],

    setCode: (code: string) => {
      const { runtimeState } = get();
      const compiled = compile(code, runtimeState);
      set({
        code,
        ast: compiled.ast,
        diagnostics: compiled.diagnostics,
        runtimeState: compiled.runtimeState,
      });
    },

    setRuntimeStateVal: (name: string, value: any) => {
      const { runtimeState, consoleLogs } = get();
      const newLogs = [...consoleLogs, `[State Update] ${name} = ${JSON.stringify(value)}`].slice(-50); // Keep last 50
      set({
        runtimeState: {
          ...runtimeState,
          [name]: value,
        },
        consoleLogs: newLogs,
      });
    },

    resetRuntimeState: () => {
      const { code } = get();
      // Compile with empty state to force re-initialization of default values
      const compiled = compile(code, {});
      set({
        runtimeState: compiled.runtimeState,
        consoleLogs: ['[Console Reset] State variables re-initialized.'],
      });
    },

    setSelectedNodeId: (nodeId: string | null) => set({ selectedNodeId: nodeId }),
    setHoveredNodeId: (nodeId: string | null) => set({ hoveredNodeId: nodeId }),
    setInspectMode: (enabled: boolean) => set({ inspectMode: enabled }),
    
    clearConsole: () => set({ consoleLogs: [] }),
    addConsoleLog: (message: string) => {
      const { consoleLogs } = get();
      set({ consoleLogs: [...consoleLogs, message].slice(-50) });
    },
  };
});
