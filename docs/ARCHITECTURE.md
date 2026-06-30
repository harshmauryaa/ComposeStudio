# Compose Studio - Architecture & Developer Guide

This document outlines the design, grammar, and rendering pipeline of **Compose Studio**, a browser-based interpreter that parses Compose-like syntax and renders it into clean HTML/CSS through React.

---

## 1. Architectural Overview

The engine follows a strict layered architecture:

```
[UI Layer (IDE Layout & Panes)]
         ↓
[Editor Layer (Monaco / Autocomplete)]
         ↓
[Language Engine (Lexer, Parser, AST, Validator, Registry)]
         ↓
[Runtime (Remember State Store & Evaluator)]
         ↓
[Renderer (React, HTML/CSS Exporter)]
```

### Key Rules
* **Strict Separation of Concerns**: The Language Engine never imports React. The Renderer never parses raw text. The UI is completely isolated from parsing logic.
* **Registry Pattern**: All components and modifiers are registered dynamically to support plug-and-play Material 3 components in the future.

---

## 2. Language Grammar

The interpreter supports a Compose-inspired subset:

```kotlin
// State Declarations
val stateVar = remember { mutableStateOf(defaultValue) }

// Composable calls with named/positional arguments and trailing lambdas
Column(
    modifier = Modifier.fillMaxWidth().padding(16.dp)
) {
    Text(text = "Hello \${stateVar.value}")
    Button(onClick = { stateVar.value = stateVar.value + 1 }) {
        Text("Click Me")
    }
}
```

---

## 3. Lexer & Parser Design

### Lexer
* **Tokenizing**: Reads character-by-character, identifying keywords (`val`, `remember`, `mutableStateOf`), operators (`.`, `,`, `=`, `{`, `}`), literals (`String`, `Number`, `Float`, `Dp`, `Boolean`), and identifiers.
* **Positions**: Tracks lines, columns, and absolute offsets to output `SourceRange` parameters for Monaco squiggles.

### Parser
* **Recursive Descent**: Implements predictive parsing.
* **Syntax Recovery**: When a syntax error occurs, the parser logs the diagnostic and skips tokens until the next statement block begins (e.g., `val` or an uppercase identifier), preventing editor crashes.

---

## 4. AST Node Specification

Every node inherits `BaseASTNode`:
```typescript
export interface BaseASTNode {
  id: string; // Unique GUID
  type: ASTNodeType; // Node category
  range: SourceRange; // File positions
}
```

Available node types:
* `Program`: Collection of statement nodes.
* `StateDeclaration`: Declares a local state via `remember`.
* `ComposableCall`: Invokes a component (e.g. `Column`, `Text`).
* `IfStatement`: Represents conditional branches.
* `ModifierChain` / `ModifierCall`: Modifiers applied sequentially.
* `Literal`: Holds string, number, color, or enum values.
* `Lambda`: Action closures.

---

## 5. Registry Pattern

We avoid large conditional switch blocks. Layout and input components are declared inside a registry:

```typescript
export interface ComponentSpec {
  name: string;
  allowedParams: Record<string, ParamType>;
  requiredParams: string[];
  render: (props: any, children: React.ReactNode, context: any) => React.ReactNode;
}
```

The registries are populated dynamically inside `src/language/registry/defaultRegistries.ts`.

---

## 6. Contribution Guide

### Adding a New Component
1. Open [defaultRegistries.ts](file:///Users/harshmaurya/ComposeStudio/src/language/registry/defaultRegistries.ts).
2. Register your component using `ComponentRegistry.getInstance().register({ ... })`:
   ```typescript
   compRegistry.register({
     name: 'MyComponent',
     allowedParams: {
       text: 'string',
       modifier: 'modifier'
     },
     requiredParams: ['text'],
     render: (props, children, context) => {
       const base = defaultPropsAndClass(props, context);
       return React.createElement('div', base, props.text);
     }
   });
   ```

### Adding a New Modifier
1. Open [defaultRegistries.ts](file:///Users/harshmaurya/ComposeStudio/src/language/registry/defaultRegistries.ts).
2. Register your modifier CSS conversion:
   ```typescript
   modRegistry.register({
     name: 'opacity',
     paramTypes: ['float'],
     toCSS: (args) => ({ opacity: String(args[0]) })
   });
   ```
