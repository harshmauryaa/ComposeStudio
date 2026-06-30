import type { Monaco } from '@monaco-editor/react';
import { ComponentRegistry, ModifierRegistry } from '../language/registry/registry';

let registered = false;

/**
 * Configure Compose-specific language services on top of Monaco's Kotlin editor.
 */
export function configureMonacoLanguage(monaco: Monaco) {
  if (registered) return;
  registered = true;

  const KOTLIN_ID = 'kotlin';

  // 1. Dynamic Completion Item Provider
  monaco.languages.registerCompletionItemProvider(KOTLIN_ID, {
    triggerCharacters: ['.', '('],
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const compRegistry = ComponentRegistry.getInstance();
      const modRegistry = ModifierRegistry.getInstance();

      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // 1. Modifiers completion: Modifier.
      if (textUntilPosition.match(/Modifier\.$/)) {
        const suggestions = modRegistry.getAll().map(mod => ({
          label: mod.name,
          kind: monaco.languages.CompletionItemKind.Method,
          documentation: mod.description || `Modifier: Modifier.${mod.name}()`,
          insertText: mod.name + '($1)',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        }));
        return { suggestions };
      }

      // 2. Colors completion: Color.
      if (textUntilPosition.match(/Color\.$/)) {
        const colors = [
          'Red', 'Blue', 'Green', 'Yellow', 'White', 'Black', 'Gray', 'LightGray', 'DarkGray', 'Transparent', 'Primary', 'Secondary'
        ];
        const suggestions = colors.map(c => ({
          label: c,
          kind: monaco.languages.CompletionItemKind.Color,
          documentation: `Predefined color: Color.${c}`,
          insertText: c,
          range,
        }));
        return { suggestions };
      }

      // 3. Alignments completion: Alignment.
      if (textUntilPosition.match(/Alignment\.$/)) {
        const alignments = [
          'Top', 'Center', 'Bottom', 'Start', 'CenterHorizontally', 'End', 'TopStart', 'TopEnd', 'BottomStart', 'BottomEnd'
        ];
        const suggestions = alignments.map(a => ({
          label: a,
          kind: monaco.languages.CompletionItemKind.EnumMember,
          documentation: `Alignment constant: Alignment.${a}`,
          insertText: a,
          range,
        }));
        return { suggestions };
      }

      // 4. Arrangements completion: Arrangement.
      if (textUntilPosition.match(/Arrangement\.$/)) {
        const arrangements = [
          'Top', 'Center', 'Bottom', 'Start', 'End', 'SpaceBetween', 'SpaceAround', 'SpaceEvenly'
        ];
        const suggestions = arrangements.map(a => ({
          label: a,
          kind: monaco.languages.CompletionItemKind.EnumMember,
          documentation: `Arrangement constant: Arrangement.${a}`,
          insertText: a,
          range,
        }));
        return { suggestions };
      }

      // 5. Parameter completion: inside Composable(
      const openCallMatch = textUntilPosition.match(/(\w+)\s*\([^)]*$/);
      if (openCallMatch) {
        const componentName = openCallMatch[1];
        const spec = compRegistry.get(componentName);
        if (spec) {
          const suggestions = Object.keys(spec.allowedParams).map(param => {
            const type = spec.allowedParams[param];
            let insertText = `${param} = $1`;
            if (type === 'modifier') insertText = `${param} = Modifier.$1`;
            if (type === 'color') insertText = `${param} = Color.$1`;
            if (type === 'lambda') insertText = `${param} = { $1 }`;
            if (type === 'string') insertText = `${param} = "$1"`;
            
            return {
              label: param,
              kind: monaco.languages.CompletionItemKind.Property,
              documentation: `Parameter '${param}' of type '${type}'.`,
              insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            };
          });
          return { suggestions };
        }
      }

      // 6. Default fallback: suggest composable classes and keyword helper snippets
      const componentSuggestions = compRegistry.getAll().map(spec => {
        let insertText = `${spec.name} {\n\t$0\n}`;
        if (['Text', 'Image', 'Spacer', 'CircularProgressIndicator', 'LinearProgressIndicator', 'HorizontalDivider', 'VerticalDivider', 'Divider', 'RadioButton', 'Checkbox', 'Switch', 'Slider', 'RangeSlider', 'DatePicker', 'TimePicker'].includes(spec.name)) {
          insertText = `${spec.name}($1)`;
        }
        
        return {
          label: spec.name,
          kind: monaco.languages.CompletionItemKind.Class,
          documentation: spec.description || `Composable component <${spec.name} />.`,
          insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        };
      });

      const suggestions = [
        ...componentSuggestions,
        {
          label: 'val remember state',
          kind: monaco.languages.CompletionItemKind.Keyword,
          documentation: 'Declare remember mutableStateOf',
          insertText: 'val ${1:state} = remember { mutableStateOf($2) }',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: 'var remember state delegated',
          kind: monaco.languages.CompletionItemKind.Keyword,
          documentation: 'Declare delegated remember mutableStateOf',
          insertText: 'var ${1:state} by remember { mutableStateOf($2) }',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        }
      ];

      return { suggestions };
    },
  });

  // 2. Dynamic Hover Info Provider
  monaco.languages.registerHoverProvider(KOTLIN_ID, {
    provideHover: (model: any, position: any) => {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const compRegistry = ComponentRegistry.getInstance();
      const modRegistry = ModifierRegistry.getInstance();

      const compSpec = compRegistry.get(word.word);
      if (compSpec) {
        const allowedParamsList = Object.keys(compSpec.allowedParams)
          .map(p => `  - **${p}**: \`${compSpec.allowedParams[p]}\``)
          .join('\n');

        return {
          contents: [
            { value: `**Composable component: <${compSpec.name} />**` },
            { value: compSpec.description || 'Custom layout component.' },
            { value: `**Allowed Parameters:**\n${allowedParamsList}` },
            { value: `[Official Reference Docs](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary)` }
          ]
        };
      }

      const modSpec = modRegistry.get(word.word);
      if (modSpec) {
        return {
          contents: [
            { value: `**Modifier: Modifier.${modSpec.name}()**` },
            { value: modSpec.description || 'Compose layout modifier.' },
            { value: `**Param types:** \`(${modSpec.paramTypes.join(', ') || 'none'})\`` }
          ]
        };
      }

      // Static overrides for keywords
      const overrides: Record<string, string[]> = {
        remember: [
          '**remember**',
          'Remember the value produced by a calculation. Used to cache state variables locally across recompositions.'
        ],
        by: [
          '**by (Kotlin Delegate)**',
          'Property delegation syntax. Allows direct read/write of Compose states without accessing `.value`.'
        ],
        Modifier: [
          '**Modifier**',
          'An ordered, immutable collection of modifier elements that decorate or add behavior to Compose layouts.'
        ]
      };

      if (word.word in overrides) {
        return {
          contents: overrides[word.word].map(text => ({ value: text }))
        };
      }

      return null;
    }
  });
}
