import React from 'react';
import { ComponentRegistry, ModifierRegistry } from './registry';
import { resolveModifierChain } from '../../runtime/modifier/modifierResolver';

// Color conversion helper: E.g., Color(0xFF0F172A) -> "#0F172A" or Color.Red -> "red"
export function resolveColor(colorVal: string | number): string {
  if (typeof colorVal === 'number') {
    // Check if it's 0x... hex format
    let hex = colorVal.toString(16);
    if (hex.length > 8) hex = hex.substring(hex.length - 8); // Trim to ARGB
    if (hex.length === 8) {
      // ARGB -> RGBA
      const a = parseInt(hex.substring(0, 2), 16) / 255;
      const r = parseInt(hex.substring(2, 4), 16);
      const g = parseInt(hex.substring(4, 6), 16);
      const b = parseInt(hex.substring(6, 8), 16);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `#${hex}`;
  }

  const str = String(colorVal);
  if (str.startsWith('Color.')) {
    const name = str.substring(6).toLowerCase();
    switch (name) {
      case 'red': return '#ef4444';
      case 'blue': return '#3b82f6';
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'white': return '#ffffff';
      case 'black': return '#000000';
      case 'gray': return '#64748b';
      case 'transparent': return 'transparent';
      default: return name;
    }
  }

  if (str.startsWith('Color(')) {
    // Parse Color(0xFF123456)
    const match = str.match(/Color\((0x[0-9a-fA-F]+|[0-9]+)\)/);
    if (match) {
      const parsed = parseInt(match[1]);
      if (!isNaN(parsed)) return resolveColor(parsed);
    }
  }

  return str;
}

// Global scope helper for evaluations
export const interpreterGlobals = {
  RoundedCornerShape: (dp: any) => `${parseFloat(dp)}px`,
  CircleShape: '50%',
  RectangleShape: '0px',
  Alignment: {
    Top: 'flex-start',
    Center: 'center',
    Bottom: 'flex-end',
    Start: 'flex-start',
    CenterHorizontally: 'center',
    End: 'flex-end',
    TopStart: 'flex-start',
    TopEnd: 'flex-end',
    BottomStart: 'flex-start',
    BottomEnd: 'flex-end',
  },
  Arrangement: {
    Top: 'flex-start',
    Center: 'center',
    Bottom: 'flex-end',
    Start: 'flex-start',
    End: 'flex-end',
    SpaceBetween: 'space-between',
    SpaceAround: 'space-around',
    SpaceEvenly: 'space-evenly',
  },
  FontWeight: {
    Normal: '400',
    Medium: '500',
    SemiBold: '600',
    Bold: '700',
    ExtraBold: '800',
  },
  FontStyle: {
    Normal: 'normal',
    Italic: 'italic',
  },
  TextAlign: {
    Left: 'left',
    Center: 'center',
    Right: 'right',
    Justify: 'justify',
  },
  TextDecoration: {
    None: 'none',
    Underline: 'underline',
    LineThrough: 'line-through',
  },
  TextOverflow: {
    Clip: 'clip',
    Ellipsis: 'ellipsis',
    Visible: 'visible',
  },
  ContentScale: {
    Crop: 'cover',
    Fit: 'contain',
    FillBounds: 'fill',
    Inside: 'none',
    None: 'none',
  },
  ContentAlpha: {
    High: 1,
    Medium: 0.74,
    Disabled: 0.38,
  },
  KeyboardType: {
    Text: 'text',
    Number: 'number',
    Phone: 'tel',
    Email: 'email',
    Password: 'password',
  },
  ImeAction: {
    Default: 'default',
    Go: 'go',
    Search: 'search',
    Send: 'send',
    Next: 'next',
    Done: 'done',
  },
  KeyboardCapitalization: {
    None: 'none',
    Characters: 'characters',
    Words: 'words',
    Sentences: 'sentences',
  },
  StrokeCap: {
    Butt: 'butt',
    Round: 'round',
    Square: 'square',
  },
  StrokeJoin: {
    Miter: 'miter',
    Round: 'round',
    Bevel: 'bevel',
  },
  BlendMode: {
    SrcOver: 'source-over',
    DstOver: 'destination-over',
  },
  Color: {
    Red: 'Color.Red',
    Blue: 'Color.Blue',
    Green: 'Color.Green',
    Yellow: 'Color.Yellow',
    White: 'Color.White',
    Black: 'Color.Black',
    Gray: 'Color.Gray',
    LightGray: 'Color.LightGray',
    DarkGray: 'Color.DarkGray',
    Transparent: 'Color.Transparent',
    Primary: 'Color.Primary',
    Secondary: 'Color.Secondary',
  },
  // Compose Runtime lifecycle stubs
  derivedStateOf: (calc: () => any) => ({ value: calc() }),
  rememberSaveable: (calc: () => any) => calc(),
  rememberCoroutineScope: () => ({
    launch: (cb: () => void) => cb(),
  }),
  LaunchedEffect: (key: any, block: () => void) => {},
  DisposableEffect: (key: any, block: () => void) => ({ dispose: () => {} }),
  SideEffect: (block: () => void) => {},
  produceState: (initial: any, key: any, producer: () => void) => ({ value: initial }),
  CompositionLocal: {
    current: null,
  },
  LocalContentColor: {
    current: 'Color.White',
  },
  lightColorScheme: (overrides: any = {}) => ({
    isDark: false,
    primary: 'var(--md-sys-color-primary)',
    onPrimary: 'var(--md-sys-color-on-primary)',
    primaryContainer: 'var(--md-sys-color-primary-container)',
    onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
    surface: 'var(--md-sys-color-surface)',
    onSurface: 'var(--md-sys-color-on-surface)',
    surfaceVariant: 'var(--md-sys-color-surface-variant)',
    onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)',
    outline: 'var(--md-sys-color-outline)',
    ...overrides,
  }),
  darkColorScheme: (overrides: any = {}) => ({
    isDark: true,
    primary: 'var(--md-sys-color-primary)',
    onPrimary: 'var(--md-sys-color-on-primary)',
    primaryContainer: 'var(--md-sys-color-primary-container)',
    onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
    surface: 'var(--md-sys-color-surface)',
    onSurface: 'var(--md-sys-color-on-surface)',
    surfaceVariant: 'var(--md-sys-color-surface-variant)',
    onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)',
    outline: 'var(--md-sys-color-outline)',
    ...overrides,
  }),
  MaterialTheme: {
    colorScheme: {
      primary: 'var(--md-sys-color-primary)',
      onPrimary: 'var(--md-sys-color-on-primary)',
      primaryContainer: 'var(--md-sys-color-primary-container)',
      onPrimaryContainer: 'var(--md-sys-color-on-primary-container)',
      surface: 'var(--md-sys-color-surface)',
      onSurface: 'var(--md-sys-color-on-surface)',
      surfaceVariant: 'var(--md-sys-color-surface-variant)',
      onSurfaceVariant: 'var(--md-sys-color-on-surface-variant)',
      outline: 'var(--md-sys-color-outline)',
    },
    typography: {
      displayLarge: { fontSize: 'var(--md-sys-typescale-display-large-size)', fontWeight: 'var(--md-sys-typescale-display-large-weight)' },
      displayMedium: { fontSize: 'var(--md-sys-typescale-display-medium-size)', fontWeight: 'var(--md-sys-typescale-display-medium-weight)' },
      displaySmall: { fontSize: 'var(--md-sys-typescale-display-small-size)', fontWeight: 'var(--md-sys-typescale-display-small-weight)' },
      headlineLarge: { fontSize: 'var(--md-sys-typescale-headline-large-size)', fontWeight: 'var(--md-sys-typescale-headline-large-weight)' },
      headlineMedium: { fontSize: 'var(--md-sys-typescale-headline-medium-size)', fontWeight: 'var(--md-sys-typescale-headline-medium-weight)' },
      headlineSmall: { fontSize: 'var(--md-sys-typescale-headline-small-size)', fontWeight: 'var(--md-sys-typescale-headline-small-weight)' },
      bodyLarge: { fontSize: 'var(--md-sys-typescale-body-large-size)', fontWeight: 'var(--md-sys-typescale-body-large-weight)' },
      bodyMedium: { fontSize: 'var(--md-sys-typescale-body-medium-size)', fontWeight: 'var(--md-sys-typescale-body-medium-weight)' },
      bodySmall: { fontSize: 'var(--md-sys-typescale-body-small-size)', fontWeight: 'var(--md-sys-typescale-body-small-weight)' },
    },
  },
};

export function registerDefaults() {
  const compRegistry = ComponentRegistry.getInstance();
  const modRegistry = ModifierRegistry.getInstance();

  compRegistry.clear();
  modRegistry.clear();

  // -------------------------------------------------------------
  // Modifiers Registration
  // -------------------------------------------------------------

  modRegistry.register({
    name: 'padding',
    paramTypes: ['dp'],
    toCSS: (args, namedArgs) => {
      if (namedArgs && Object.keys(namedArgs).length > 0) {
        const top = namedArgs.top !== undefined ? parseFloat(namedArgs.top) : (namedArgs.vertical !== undefined ? parseFloat(namedArgs.vertical) : 0);
        const bottom = namedArgs.bottom !== undefined ? parseFloat(namedArgs.bottom) : (namedArgs.vertical !== undefined ? parseFloat(namedArgs.vertical) : 0);
        const start = namedArgs.start !== undefined ? parseFloat(namedArgs.start) : (namedArgs.horizontal !== undefined ? parseFloat(namedArgs.horizontal) : 0);
        const end = namedArgs.end !== undefined ? parseFloat(namedArgs.end) : (namedArgs.horizontal !== undefined ? parseFloat(namedArgs.horizontal) : 0);
        return { padding: `${top}px ${end}px ${bottom}px ${start}px` };
      }
      if (args.length === 1) return { padding: `${args[0]}px` };
      if (args.length === 2) return { padding: `${args[0]}px ${args[1]}px` };
      return { padding: '16px' };
    },
  });

  modRegistry.register({
    name: 'size',
    paramTypes: ['dp'],
    toCSS: (args): Record<string, string> => {
      if (args.length === 1) return { width: `${args[0]}px`, height: `${args[0]}px` };
      if (args.length === 2) return { width: `${args[0]}px`, height: `${args[1]}px` };
      return {};
    },
  });

  modRegistry.register({
    name: 'width',
    paramTypes: ['dp'],
    toCSS: (args) => ({ width: `${args[0]}px` }),
  });

  modRegistry.register({
    name: 'height',
    paramTypes: ['dp'],
    toCSS: (args) => ({ height: `${args[0]}px` }),
  });

  modRegistry.register({
    name: 'fillMaxWidth',
    paramTypes: ['float'],
    toCSS: (args) => {
      const frac = args[0] !== undefined ? args[0] : 1;
      return { width: `${frac * 100}%` };
    },
  });

  modRegistry.register({
    name: 'fillMaxHeight',
    paramTypes: ['float'],
    toCSS: (args) => {
      const frac = args[0] !== undefined ? args[0] : 1;
      return { height: `${frac * 100}%` };
    },
  });

  modRegistry.register({
    name: 'fillMaxSize',
    paramTypes: ['float'],
    toCSS: (args) => {
      const frac = args[0] !== undefined ? args[0] : 1;
      return { width: `${frac * 100}%`, height: `${frac * 100}%` };
    },
  });

  modRegistry.register({
    name: 'background',
    paramTypes: ['color'],
    toCSS: (args) => ({ 'background-color': resolveColor(args[0]) }),
  });

  modRegistry.register({
    name: 'border',
    paramTypes: ['dp', 'color'],
    toCSS: (args) => {
      const width = args[0] || 1;
      const color = resolveColor(args[1]) || '#ccc';
      return { border: `${width}px solid ${color}` };
    },
  });

  modRegistry.register({
    name: 'clip',
    paramTypes: ['string'], // E.g., RoundedCornerShape(8.dp) -> '8px' or CircleShape -> '50%'
    toCSS: (args) => ({ 'border-radius': args[0] || '0px', overflow: 'hidden' }),
  });

  modRegistry.register({
    name: 'shadow',
    paramTypes: ['dp'],
    toCSS: (args) => {
      const elev = args[0] || 4;
      return { 'box-shadow': `0px ${elev}px ${elev * 2}px rgba(0, 0, 0, 0.2)` };
    },
  });

  modRegistry.register({
    name: 'weight',
    paramTypes: ['float'],
    toCSS: (args) => ({ 'flex-grow': String(args[0] || 1) }),
  });

  modRegistry.register({
    name: 'offset',
    paramTypes: ['dp', 'dp'],
    toCSS: (args) => {
      const x = args[0] || 0;
      const y = args[1] || 0;
      return { transform: `translate(${x}px, ${y}px)` };
    },
  });

  modRegistry.register({
    name: 'rotate',
    paramTypes: ['float'],
    toCSS: (args) => ({ transform: `rotate(${args[0] || 0}deg)` }),
  });

  modRegistry.register({
    name: 'scale',
    paramTypes: ['float'],
    toCSS: (args) => ({ transform: `scale(${args[0] || 1})` }),
  });

  modRegistry.register({
    name: 'alpha',
    paramTypes: ['float'],
    toCSS: (args) => ({ opacity: String(args[0] !== undefined ? args[0] : 1) }),
  });

  modRegistry.register({
    name: 'clickable',
    paramTypes: ['lambda'],
    toCSS: () => ({ cursor: 'pointer' }), // click event is bound directly in resolver
  });

  modRegistry.register({
    name: 'aspectRatio',
    paramTypes: ['float'],
    toCSS: (args) => ({ 'aspect-ratio': String(args[0]) }),
  });

  modRegistry.register({
    name: 'zIndex',
    paramTypes: ['number'],
    toCSS: (args) => ({ 'z-index': String(args[0]) }),
  });

  // -------------------------------------------------------------
  // Components Registration
  // -------------------------------------------------------------

  const defaultPropsAndClass = (props: any, context: any) => {
    const { style, onClick } = resolveModifierChain(props.modifier, context.interpreter, context.scope);
    const classes = [
      context.nodeId === context.selectedNodeId ? 'preview-highlight-selected' : '',
      context.nodeId === context.hoveredNodeId ? 'preview-highlight-hover' : '',
    ].filter(Boolean).join(' ');

    return {
      style,
      onClick: onClick || props.onClick,
      className: classes || undefined,
      'data-node-id': context.nodeId,
    };
  };

  // COLUMN
  compRegistry.register({
    name: 'Column',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="display: flex; flex-direction: column; box-sizing: border-box;">${childrenHtml}</div>`;
    },
  });

  // ROW
  compRegistry.register({
    name: 'Row',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="display: flex; flex-direction: row; align-items: center; box-sizing: border-box;">${childrenHtml}</div>`;
    },
  });

  // BOX
  compRegistry.register({
    name: 'Box',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        position: 'relative',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="position: relative; box-sizing: border-box;">${childrenHtml}</div>`;
    },
  });

  // SPACER
  compRegistry.register({
    name: 'Spacer',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        flexShrink: 0,
        ...base.style,
      };
      return React.createElement('div', { ...base, style });
    },
    htmlRender: (props) => {
      return `<div style="flex-shrink: 0;"></div>`;
    },
  });

  // TEXT
  compRegistry.register({
    name: 'Text',
    allowedParams: {
      text: 'string',
      modifier: 'modifier',
      color: 'color',
      fontSize: 'sp',
      fontWeight: 'enum',
      fontStyle: 'enum',
      textAlign: 'enum',
      textDecoration: 'enum',
      style: 'enum',
    },
    requiredParams: ['text'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        color: props.color ? resolveColor(props.color) : 'inherit',
        fontSize: props.fontSize ? `${props.fontSize}px` : (props.style?.fontSize || 'inherit'),
        fontWeight: props.fontWeight || (props.style?.fontWeight || 'inherit'),
        fontStyle: props.fontStyle || 'inherit',
        textAlign: props.textAlign || 'inherit',
        textDecoration: props.textDecoration || 'inherit',
        margin: 0,
        ...base.style,
      };
      return React.createElement('p', { ...base, style }, props.text || '');
    },
    htmlRender: (props) => {
      const color = props.color ? resolveColor(props.color) : 'inherit';
      const fontSize = props.fontSize ? `${props.fontSize}px` : (props.style?.fontSize || 'inherit');
      const fontWeight = props.fontWeight || (props.style?.fontWeight || 'inherit');
      const fontStyle = props.fontStyle || 'inherit';
      const textAlign = props.textAlign || 'inherit';
      const textDec = props.textDecoration || 'inherit';
      return `<p style="margin: 0; color: ${color}; font-size: ${fontSize}; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-align: ${textAlign}; text-decoration: ${textDec};">${props.text || ''}</p>`;
    },
  });

  // IMAGE
  compRegistry.register({
    name: 'Image',
    allowedParams: {
      url: 'string',
      contentDescription: 'string',
      modifier: 'modifier',
    },
    requiredParams: ['url'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        objectFit: 'cover',
        ...base.style,
      };
      return React.createElement('img', {
        ...base,
        style,
        src: props.url,
        alt: props.contentDescription || 'ComposeWeb Image',
      });
    },
    htmlRender: (props) => {
      return `<img src="${props.url}" alt="${props.contentDescription || ''}" style="object-fit: cover;" />`;
    },
  });

  // DIVIDER
  compRegistry.register({
    name: 'Divider',
    allowedParams: {
      modifier: 'modifier',
      color: 'color',
      thickness: 'dp',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        border: 'none',
        height: props.thickness ? `${props.thickness}px` : '1px',
        backgroundColor: props.color ? resolveColor(props.color) : 'var(--md-sys-color-outline)',
        width: '100%',
        margin: 0,
        ...base.style,
      };
      return React.createElement('hr', { ...base, style });
    },
    htmlRender: (props) => {
      return `<hr style="border: none; height: ${props.thickness || 1}px; background-color: ${props.color ? resolveColor(props.color) : 'var(--md-sys-color-outline)'}; width: 100%; margin: 0;" />`;
    },
  });

  // BUTTON
  compRegistry.register({
    name: 'Button',
    allowedParams: {
      onClick: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['onClick'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 24px',
        backgroundColor: 'var(--md-sys-color-primary)',
        color: 'var(--md-sys-color-on-primary)',
        border: 'none',
        borderRadius: '100px', // M3 standard pill shape
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease',
        ...base.style,
      };

      // Wrap click handler to execute state callback
      const onBtnClick = (e: any) => {
        e.stopPropagation();
        if (context.inspectMode) {
          context.onSelectNode(context.nodeId);
          return;
        }
        if (props.onClick) {
          props.onClick();
        }
      };

      return React.createElement(
        'button',
        {
          ...base,
          style,
          onClick: onBtnClick,
        },
        children
      );
    },
    htmlRender: (props, childrenHtml) => {
      return `<button style="padding: 10px 24px; background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border: none; border-radius: 100px; cursor: pointer; font-size: 14px; font-weight: 500;">${childrenHtml}</button>`;
    },
  });

  // ICON BUTTON
  compRegistry.register({
    name: 'IconButton',
    allowedParams: {
      onClick: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['onClick'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#ffffff',
        border: 'none',
        cursor: 'pointer',
        ...base.style,
      };
      
      const onIconClick = (e: any) => {
        e.stopPropagation();
        if (context.inspectMode) {
          context.onSelectNode(context.nodeId);
          return;
        }
        if (props.onClick) props.onClick();
      };

      return React.createElement('button', { ...base, style, onClick: onIconClick }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<button style="width: 40px; height: 40px; border-radius: 50%; border: none; background-color: rgba(0,0,0,0.1); cursor: pointer;">${childrenHtml}</button>`;
    },
  });

  // TEXTFIELD
  compRegistry.register({
    name: 'TextField',
    allowedParams: {
      value: 'string',
      onValueChange: 'lambda',
      placeholder: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['value', 'onValueChange'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '4px 4px 0 0',
        backgroundColor: 'var(--md-sys-color-surface-variant)',
        border: 'none',
        borderBottom: '1px solid var(--md-sys-color-outline)',
        color: 'var(--md-sys-color-on-surface-variant)',
        fontSize: '16px',
        outline: 'none',
        boxSizing: 'border-box',
        ...base.style,
      };

      const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (context.inspectMode) return;
        if (props.onValueChange) {
          props.onValueChange(e.target.value);
        }
      };

      let placeholderElement: React.ReactNode = null;
      if (!props.value) {
        if (typeof props.placeholder === 'function') {
          try {
            placeholderElement = props.placeholder();
          } catch (e) {
            placeholderElement = null;
          }
        } else if (typeof props.placeholder === 'string') {
          placeholderElement = props.placeholder;
        }
      }

      const inputElement = React.createElement('input', {
        ...base,
        style: inputStyle,
        type: 'text',
        value: props.value || '',
        onChange,
        disabled: context.inspectMode,
      });

      if (placeholderElement) {
        return React.createElement(
          'div',
          { style: { position: 'relative', width: '100%', display: 'flex', flexDirection: 'column' } },
          inputElement,
          React.createElement(
            'div',
            {
              style: {
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--md-sys-color-on-surface-variant)',
                opacity: 0.6,
                fontSize: '16px',
                pointerEvents: 'none',
                fontFamily: 'sans-serif',
              }
            },
            placeholderElement
          )
        );
      }

      return inputElement;
    },
    htmlRender: (props) => {
      let placeholderText = '';
      if (typeof props.placeholder === 'string') {
        placeholderText = props.placeholder;
      }
      return `<input type="text" value="${props.value || ''}" placeholder="${placeholderText}" style="width: 100%; padding: 12px 16px; border-radius: 4px 4px 0 0; background-color: var(--md-sys-color-surface-variant); border: none; border-bottom: 1px solid var(--md-sys-color-outline); color: var(--md-sys-color-on-surface-variant); font-size: 16px; outline: none; box-sizing: border-box;" />`;
    },
  });

  // CHECKBOX
  compRegistry.register({
    name: 'Checkbox',
    allowedParams: {
      checked: 'boolean',
      onCheckedChange: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['checked', 'onCheckedChange'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        width: '18px',
        height: '18px',
        cursor: 'pointer',
        ...base.style,
      };

      const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (context.inspectMode) return;
        if (props.onCheckedChange) {
          props.onCheckedChange(e.target.checked);
        }
      };

      return React.createElement('input', {
        ...base,
        style,
        type: 'checkbox',
        checked: !!props.checked,
        onChange,
        disabled: context.inspectMode,
      });
    },
    htmlRender: (props) => {
      return `<input type="checkbox" ${props.checked ? 'checked' : ''} style="width: 18px; height: 18px;" />`;
    },
  });

  // SWITCH
  compRegistry.register({
    name: 'Switch',
    allowedParams: {
      checked: 'boolean',
      onCheckedChange: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['checked', 'onCheckedChange'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const isChecked = !!props.checked;

      const trackStyle: React.CSSProperties = {
        width: '52px',
        height: '32px',
        backgroundColor: isChecked ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)',
        border: isChecked ? 'none' : '2px solid var(--md-sys-color-outline)',
        borderRadius: '16px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        boxSizing: 'border-box',
        ...base.style,
      };

      const thumbStyle: React.CSSProperties = {
        width: isChecked ? '24px' : '16px',
        height: isChecked ? '24px' : '16px',
        backgroundColor: isChecked ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-outline)',
        borderRadius: '50%',
        position: 'absolute',
        left: isChecked ? '24px' : '6px',
        top: '50%',
        transform: 'translateY(-50%)',
        transition: 'all 0.2s',
      };

      const onToggle = () => {
        if (context.inspectMode) return;
        if (props.onCheckedChange) {
          props.onCheckedChange(!isChecked);
        }
      };

      const thumb = React.createElement('div', { style: thumbStyle });
      return React.createElement('div', { ...base, style: trackStyle, onClick: onToggle }, thumb);
    },
    htmlRender: (props) => {
      const isChecked = !!props.checked;
      const trackBg = isChecked ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-variant)';
      const trackBorder = isChecked ? 'none' : '2px solid var(--md-sys-color-outline)';
      const thumbBg = isChecked ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-outline)';
      const thumbSize = isChecked ? '24px' : '16px';
      const thumbLeft = isChecked ? '24px' : '6px';
      
      return `<div style="width: 52px; height: 32px; background-color: ${trackBg}; border: ${trackBorder}; border-radius: 16px; display: inline-flex; align-items: center; position: relative; cursor: pointer; box-sizing: border-box;">
        <div style="width: ${thumbSize}; height: ${thumbSize}; background-color: ${thumbBg}; border-radius: 50%; position: absolute; left: ${thumbLeft}; top: 50%; transform: translateY(-50%); transition: all 0.2s;"></div>
      </div>`;
    },
  });

  // CARD
  compRegistry.register({
    name: 'Card',
    allowedParams: {
      modifier: 'modifier',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        borderRadius: '12px',
        backgroundColor: 'var(--md-sys-color-surface-variant)',
        color: 'var(--md-sys-color-on-surface-variant)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="border-radius: 12px; background-color: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; box-sizing: border-box;">${childrenHtml}</div>`;
    },
  });

  // SURFACE
  compRegistry.register({
    name: 'Surface',
    allowedParams: {
      modifier: 'modifier',
      color: 'color',
      contentColor: 'color',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        boxSizing: 'border-box',
        backgroundColor: props.color ? resolveColor(props.color) : 'var(--md-sys-color-surface)',
        color: props.contentColor ? resolveColor(props.contentColor) : 'var(--md-sys-color-on-surface)',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      const bgColor = props.color ? resolveColor(props.color) : 'var(--md-sys-color-surface)';
      const textColor = props.contentColor ? resolveColor(props.contentColor) : 'var(--md-sys-color-on-surface)';
      return `<div style="box-sizing: border-box; background-color: ${bgColor}; color: ${textColor};">${childrenHtml}</div>`;
    },
  });

  // LAZYCOLUMN
  compRegistry.register({
    name: 'LazyColumn',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        maxHeight: '100%',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="display: flex; flex-direction: column; overflow-y: auto; max-height: 100%; box-sizing: border-box;">${childrenHtml}</div>`;
    },
  });

  // LAZYROW
  compRegistry.register({
    name: 'LazyRow',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        overflowX: 'auto',
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="display: flex; flex-direction: row; align-items: center; overflow-x: auto; max-width: 100%; box-sizing: border-box;">${childrenHtml}</div>`;
    },
  });

  // CIRCULAR PROGRESS INDICATOR
  compRegistry.register({
    name: 'CircularProgressIndicator',
    allowedParams: {
      modifier: 'modifier',
      color: 'color',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const color = props.color ? resolveColor(props.color) : 'var(--md-sys-color-primary)';
      
      const spinnerStyle = {
        width: '32px',
        height: '32px',
        border: `3px solid rgba(255, 255, 255, 0.1)`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        ...base.style,
      };

      // Add a style tag inside for spin animation if not present
      return React.createElement('div', {
        ...base,
        style: spinnerStyle,
      });
    },
    htmlRender: (props) => {
      const color = props.color ? resolveColor(props.color) : 'var(--md-sys-color-primary)';
      return `<div style="width: 32px; height: 32px; border: 3px solid rgba(0,0,0,0.1); border-top: 3px solid ${color}; border-radius: 50%;"></div>`;
    },
  });

  // ==============================================================
  // EXTRA MODIFIERS (M3 & UI Specifications)
  // ==============================================================
  const noopModifiers = [
    'focusable', 'focusRequester', 'pointerInput', 'nestedScroll', 
    'testTag', 'semantics', 'clearAndSetSemantics', 'layoutId', 
    'onGloballyPositioned'
  ];
  noopModifiers.forEach(name => {
    modRegistry.register({
      name,
      paramTypes: [],
      toCSS: () => ({}),
      description: `Compose UI modifier: Modifier.${name}().`
    });
  });

  modRegistry.register({
    name: 'paddingFromBaseline',
    paramTypes: ['dp'],
    toCSS: (args) => ({ 'padding-top': `${args[0] || 0}px` }),
    description: 'Add padding from baseline (CSS padding-top).'
  });

  modRegistry.register({
    name: 'absolutePadding',
    paramTypes: ['dp'],
    toCSS: (args) => ({ padding: `${args[0] || 0}px` }),
    description: 'Add absolute padding.'
  });

  modRegistry.register({
    name: 'requiredSize',
    paramTypes: ['dp'],
    toCSS: (args) => ({ width: `${args[0]}px`, height: `${args[0]}px` }),
    description: 'Set required size boundaries.'
  });

  modRegistry.register({
    name: 'requiredWidth',
    paramTypes: ['dp'],
    toCSS: (args) => ({ width: `${args[0]}px` }),
    description: 'Set required width constraint.'
  });

  modRegistry.register({
    name: 'requiredHeight',
    paramTypes: ['dp'],
    toCSS: (args) => ({ height: `${args[0]}px` }),
    description: 'Set required height constraint.'
  });

  modRegistry.register({
    name: 'defaultMinSize',
    paramTypes: ['dp'],
    toCSS: (args) => ({ 'min-width': `${args[0] || 0}px`, 'min-height': `${args[0] || 0}px` }),
    description: 'Apply default minimum size boundaries.'
  });

  modRegistry.register({
    name: 'wrapContentWidth',
    paramTypes: [],
    toCSS: () => ({ width: 'max-content' }),
    description: 'Wrap layout width around content.'
  });

  modRegistry.register({
    name: 'wrapContentHeight',
    paramTypes: [],
    toCSS: () => ({ height: 'max-content' }),
    description: 'Wrap layout height around content.'
  });

  modRegistry.register({
    name: 'wrapContentSize',
    paramTypes: [],
    toCSS: () => ({ width: 'max-content', height: 'max-content' }),
    description: 'Wrap layout dimensions around content.'
  });

  modRegistry.register({
    name: 'graphicsLayer',
    paramTypes: [],
    toCSS: (args, namedArgs) => {
      const styles: Record<string, string> = {};
      if (namedArgs) {
        if (namedArgs.alpha !== undefined) styles['opacity'] = String(namedArgs.alpha);
        if (namedArgs.scaleX !== undefined || namedArgs.scaleY !== undefined) {
          styles['transform'] = `scale(${namedArgs.scaleX ?? 1}, ${namedArgs.scaleY ?? 1})`;
        }
      }
      return styles;
    },
    description: 'Graphics layer transformation and opacity details.'
  });

  modRegistry.register({
    name: 'drawBehind',
    paramTypes: ['lambda'],
    toCSS: () => ({}),
    description: 'Draw standard Canvas graphics behind the content.'
  });

  modRegistry.register({
    name: 'drawWithContent',
    paramTypes: ['lambda'],
    toCSS: () => ({}),
    description: 'Draw standard Canvas graphics combined with content.'
  });

  modRegistry.register({
    name: 'absoluteOffset',
    paramTypes: ['dp', 'dp'],
    toCSS: (args) => ({ position: 'absolute', left: `${args[0] || 0}px`, top: `${args[1] || 0}px` }),
    description: 'Position content at absolute offsets.'
  });

  modRegistry.register({
    name: 'combinedClickable',
    paramTypes: ['lambda', 'lambda'],
    toCSS: () => ({ cursor: 'pointer' }),
    description: 'Combined click and long click gestures.'
  });

  modRegistry.register({
    name: 'toggleable',
    paramTypes: ['boolean', 'lambda'],
    toCSS: () => ({ cursor: 'pointer' }),
    description: 'Makes the element toggleable (like checkbox/switch).'
  });

  modRegistry.register({
    name: 'selectable',
    paramTypes: ['boolean', 'lambda'],
    toCSS: () => ({ cursor: 'pointer' }),
    description: 'Makes the element selectable (like radio/tab).'
  });

  modRegistry.register({
    name: 'verticalScroll',
    paramTypes: [],
    toCSS: () => ({ 'overflow-y': 'auto' }),
    description: 'Enable vertical scrolling.'
  });

  modRegistry.register({
    name: 'horizontalScroll',
    paramTypes: [],
    toCSS: () => ({ 'overflow-x': 'auto' }),
    description: 'Enable horizontal scrolling.'
  });

  modRegistry.register({
    name: 'align',
    paramTypes: ['enum'],
    toCSS: (args) => ({ 'align-self': args[0] || 'auto' }),
    description: 'Align self inside Row/Column.'
  });

  modRegistry.register({
    name: 'alignBy',
    paramTypes: ['enum'],
    toCSS: (args) => ({ 'align-self': args[0] || 'auto' }),
    description: 'Align self using layout baseline.'
  });

  modRegistry.register({
    name: 'animateContentSize',
    paramTypes: [],
    toCSS: () => ({ transition: 'all 0.2s ease-in-out' }),
    description: 'Animate bounds layout size changes.'
  });

  // Windows padding / system insets
  const insetModifiers = ['imePadding', 'systemBarsPadding', 'navigationBarsPadding', 'safeDrawingPadding', 'windowInsetsPadding', 'consumeWindowInsets'];
  insetModifiers.forEach(name => {
    modRegistry.register({
      name,
      paramTypes: [],
      toCSS: () => ({ padding: '16px' }),
      description: `Safe zone spacing modifier: ${name}.`
    });
  });

  // ==============================================================
  // EXTRA MATERIAL 3 COMPONENTS
  // ==============================================================

  // Helper for generating standard Box-like Container Components
  const registerBoxContainer = (name: string, defaultStyle: React.CSSProperties, htmlTag = 'div') => {
    compRegistry.register({
      name,
      allowedParams: {
        modifier: 'modifier',
      },
      requiredParams: [],
      description: `Material 3 ${name} container layout.`,
      render: (props, children, context) => {
        const base = defaultPropsAndClass(props, context);
        const style = { ...defaultStyle, ...base.style };
        return React.createElement(htmlTag, { ...base, style }, children);
      },
      htmlRender: (props, childrenHtml) => {
        const styleStr = Object.entries(defaultStyle).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ');
        return `<${htmlTag} style="${styleStr}">${childrenHtml}</${htmlTag}>`;
      }
    });
  };

  // 1. Cards
  registerBoxContainer('ElevatedCard', { borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '16px', backgroundColor: 'var(--md-sys-color-surface-variant)', border: 'none' });
  registerBoxContainer('OutlinedCard', { borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)', padding: '16px', backgroundColor: 'transparent' });

  // 2. Structural & Layout containers
  registerBoxContainer('NavigationBar', { height: '80px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: 'var(--md-sys-color-surface)', borderTop: '1px solid var(--md-sys-color-outline)' });
  registerBoxContainer('NavigationRail', { width: '80px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--md-sys-color-surface)', borderRight: '1px solid var(--md-sys-color-outline)' });
  registerBoxContainer('NavigationDrawer', { width: '280px', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--md-sys-color-surface)', borderRight: '1px solid var(--md-sys-color-outline)', padding: '16px' });
  registerBoxContainer('NavigationSuite', { display: 'flex', width: '100%', height: '100%' });

  // 3. Headers & Footers
  registerBoxContainer('TopAppBar', { height: '64px', display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: 'var(--md-sys-color-surface)', borderBottom: '1px solid var(--md-sys-color-outline)', fontWeight: 'bold' }, 'header');
  registerBoxContainer('CenterAlignedTopAppBar', { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', backgroundColor: 'var(--md-sys-color-surface)', borderBottom: '1px solid var(--md-sys-color-outline)', fontWeight: 'bold' }, 'header');
  registerBoxContainer('LargeTopAppBar', { height: '128px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px', backgroundColor: 'var(--md-sys-color-surface)', borderBottom: '1px solid var(--md-sys-color-outline)', fontWeight: 'bold' }, 'header');
  registerBoxContainer('MediumTopAppBar', { height: '96px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px', backgroundColor: 'var(--md-sys-color-surface)', borderBottom: '1px solid var(--md-sys-color-outline)', fontWeight: 'bold' }, 'header');
  registerBoxContainer('BottomAppBar', { height: '80px', display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: 'var(--md-sys-color-surface)', borderTop: '1px solid var(--md-sys-color-outline)' }, 'footer');

  // 4. List Items & Badges
  registerBoxContainer('ListItem', { display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: 'transparent', borderBottom: '1px solid var(--md-sys-color-outline)', gap: '16px' });
  registerBoxContainer('BadgeBox', { position: 'relative', display: 'inline-flex' });
  registerBoxContainer('ExposedDropdownMenuBox', { position: 'relative', display: 'inline-block', width: '100%' });

  // Tab rows & scrolling elements
  registerBoxContainer('TabRow', { display: 'flex', flexDirection: 'row', width: '100%', borderBottom: '1px solid var(--md-sys-color-outline)', backgroundColor: 'var(--md-sys-color-surface)' });
  registerBoxContainer('ScrollableTabRow', { display: 'flex', flexDirection: 'row', width: '100%', overflowX: 'auto', borderBottom: '1px solid var(--md-sys-color-outline)', backgroundColor: 'var(--md-sys-color-surface)' });
  registerBoxContainer('Pager', { display: 'flex', flexDirection: 'row', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%' });

  // 5. Buttons mapping helper
  const registerButtonType = (name: string, customStyle: React.CSSProperties) => {
    compRegistry.register({
      name,
      allowedParams: {
        onClick: 'lambda',
        modifier: 'modifier',
      },
      requiredParams: ['onClick'],
      description: `Material 3 ${name} component.`,
      render: (props, children, context) => {
        const base = defaultPropsAndClass(props, context);
        const style: React.CSSProperties = {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '10px 24px',
          backgroundColor: 'var(--md-sys-color-primary)',
          color: 'var(--md-sys-color-on-primary)',
          border: 'none',
          borderRadius: '100px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          userSelect: 'none',
          ...customStyle,
          ...base.style,
        };
        const onBtnClick = (e: any) => {
          e.stopPropagation();
          if (context.inspectMode) {
            context.onSelectNode(context.nodeId);
            return;
          }
          if (props.onClick) props.onClick();
        };
        return React.createElement('button', { ...base, style, onClick: onBtnClick }, children);
      },
      htmlRender: (props, childrenHtml) => {
        const defaultStyleStr = `padding: 10px 24px; border: none; border-radius: 100px; cursor: pointer; font-size: 14px; font-weight: 500; background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary)`;
        // Convert camelCase style overrides to CSS
        const customStyleStr = Object.entries(customStyle).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}: ${v}`).join('; ');
        return `<button style="${defaultStyleStr}; ${customStyleStr}">${childrenHtml}</button>`;
      }
    });
  };

  registerButtonType('ElevatedButton', { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-primary)' });
  registerButtonType('FilledTonalButton', { backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)' });
  registerButtonType('OutlinedButton', { border: '1px solid var(--md-sys-color-outline)', backgroundColor: 'transparent', color: 'var(--md-sys-color-primary)' });
  registerButtonType('TextButton', { backgroundColor: 'transparent', color: 'var(--md-sys-color-primary)' });
  registerButtonType('IconButton', { padding: '8px', borderRadius: '50%', minWidth: 'auto', backgroundColor: 'transparent', color: 'var(--md-sys-color-primary)' });
  registerButtonType('FilledIconButton', { padding: '8px', borderRadius: '50%', minWidth: 'auto', backgroundColor: 'var(--md-sys-color-primary)', color: 'var(--md-sys-color-on-primary)' });
  registerButtonType('OutlinedIconButton', { padding: '8px', borderRadius: '50%', minWidth: 'auto', border: '1px solid var(--md-sys-color-outline)', backgroundColor: 'transparent', color: 'var(--md-sys-color-primary)' });
  registerButtonType('FloatingActionButton', { padding: '16px', borderRadius: '16px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontWeight: 'bold' });
  registerButtonType('ExtendedFloatingActionButton', { padding: '16px 24px', borderRadius: '16px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontWeight: 'bold' });

  // 6. Dialogue, Overlays, and Sheets
  compRegistry.register({
    name: 'Scaffold',
    allowedParams: {
      modifier: 'modifier',
      topBar: 'lambda',
      bottomBar: 'lambda',
      floatingActionButton: 'lambda',
    },
    requiredParams: [],
    description: 'Scaffold implements the basic Material Design visual layout structure.',
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      
      const topBarNode = props.topBar ? props.topBar() : null;
      const bottomBarNode = props.bottomBar ? props.bottomBar() : null;
      const fabNode = props.floatingActionButton ? props.floatingActionButton() : null;

      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        backgroundColor: 'var(--md-sys-color-background)',
        color: 'var(--md-sys-color-on-background)',
        ...base.style,
      };

      return React.createElement(
        'div',
        { ...base, style },
        topBarNode,
        React.createElement('div', { style: { flex: 1, overflowY: 'auto', padding: '16px', boxSizing: 'border-box' } }, children),
        fabNode && React.createElement('div', { style: { position: 'absolute', right: '16px', bottom: '96px', zIndex: 10 } }, fabNode),
        bottomBarNode
      );
    },
  });

  compRegistry.register({
    name: 'AlertDialog',
    allowedParams: {
      onDismissRequest: 'lambda',
      confirmButton: 'lambda',
      dismissButton: 'lambda',
      title: 'lambda',
      text: 'lambda',
    },
    requiredParams: ['onDismissRequest', 'confirmButton'],
    description: 'AlertDialog alerts the user to important information.',
    render: (props, children, context) => {
      const titleNode = props.title ? props.title() : null;
      const textNode = props.text ? props.text() : null;
      const confirmNode = props.confirmButton ? props.confirmButton() : null;
      const dismissNode = props.dismissButton ? props.dismissButton() : null;

      return React.createElement(
        'div',
        {
          style: {
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '24px',
            boxSizing: 'border-box',
          }
        },
        React.createElement(
          'div',
          {
            style: {
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              borderRadius: '28px',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }
          },
          titleNode && React.createElement('div', { style: { fontSize: '20px', fontWeight: '500', color: 'var(--md-sys-color-on-surface)' } }, titleNode),
          textNode && React.createElement('div', { style: { fontSize: '14px', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: '1.5' } }, textNode),
          children,
          React.createElement(
            'div',
            { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' } },
            dismissNode,
            confirmNode
          )
        )
      );
    }
  });

  compRegistry.register({
    name: 'BasicAlertDialog',
    allowedParams: { onDismissRequest: 'lambda' },
    requiredParams: ['onDismissRequest'],
    render: (props, children, context) => {
      return React.createElement('div', { style: { padding: '16px', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline)', backgroundColor: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-on-surface)' } }, children);
    }
  });

  compRegistry.register({
    name: 'ModalBottomSheet',
    allowedParams: { onDismissRequest: 'lambda' },
    requiredParams: ['onDismissRequest'],
    render: (props, children, context) => {
      return React.createElement(
        'div',
        {
          style: {
            position: 'absolute',
            left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--md-sys-color-surface)',
            color: 'var(--md-sys-color-on-surface)',
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
            padding: '24px',
            maxHeight: '50%',
            overflowY: 'auto',
            zIndex: 999,
            boxShadow: '0 -4px 16px rgba(0,0,0,0.3)',
          }
        },
        children
      );
    }
  });

  compRegistry.register({
    name: 'BottomSheetScaffold',
    allowedParams: { sheetContent: 'lambda' },
    requiredParams: ['sheetContent'],
    render: (props, children, context) => {
      const sheet = props.sheetContent ? props.sheetContent() : null;
      return React.createElement('div', { style: { position: 'relative', width: '100%', height: '100%' } }, children, sheet);
    }
  });

  // 7. Inputs & Picker Widgets
  compRegistry.register({
    name: 'OutlinedTextField',
    allowedParams: {
      value: 'string',
      onValueChange: 'lambda',
      label: 'lambda',
      placeholder: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['value', 'onValueChange'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style = {
        width: '100%',
        padding: '12px 14px',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        border: '1.5px solid var(--md-sys-color-outline)',
        color: 'var(--md-sys-color-on-surface)',
        outline: 'none',
        boxSizing: 'border-box' as const,
        ...base.style,
      };
      
      const onChange = (e: any) => {
        if (context.inspectMode) return;
        if (props.onValueChange) props.onValueChange(e.target.value);
      };

      const inputElement = React.createElement('input', { ...base, style, value: props.value || '', onChange, disabled: context.inspectMode });
      
      if (props.label) {
        return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' } },
          React.createElement('div', { style: { fontSize: '12px', color: 'var(--md-sys-color-primary)', paddingLeft: '4px' } }, props.label()),
          inputElement
        );
      }
      return inputElement;
    }
  });

  compRegistry.register({
    name: 'SecureTextField',
    allowedParams: {
      value: 'string',
      onValueChange: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['value', 'onValueChange'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '4px 4px 0 0',
        backgroundColor: 'var(--md-sys-color-surface-variant)',
        border: 'none',
        borderBottom: '1px solid var(--md-sys-color-outline)',
        color: 'var(--md-sys-color-on-surface-variant)',
        outline: 'none',
        boxSizing: 'border-box' as const,
        ...base.style,
      };
      const onChange = (e: any) => {
        if (props.onValueChange) props.onValueChange(e.target.value);
      };
      return React.createElement('input', { ...base, style, type: 'password', value: props.value || '', onChange, disabled: context.inspectMode });
    }
  });

  compRegistry.register({
    name: 'RadioButton',
    allowedParams: {
      selected: 'boolean',
      onClick: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['selected', 'onClick'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const isSelected = !!props.selected;

      const style: React.CSSProperties = {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: `2px solid ${isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)'}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxSizing: 'border-box',
        ...base.style,
      };

      const dotStyle = {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: 'var(--md-sys-color-primary)',
        display: isSelected ? 'block' : 'none',
      };

      const onRadioClick = () => {
        if (context.inspectMode) return;
        if (props.onClick) props.onClick();
      };

      return React.createElement('div', { ...base, style, onClick: onRadioClick },
        React.createElement('div', { style: dotStyle })
      );
    }
  });

  compRegistry.register({
    name: 'Slider',
    allowedParams: {
      value: 'float',
      onValueChange: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['value', 'onValueChange'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const onChange = (e: any) => {
        if (props.onValueChange) props.onValueChange(parseFloat(e.target.value));
      };
      return React.createElement('input', {
        ...base,
        type: 'range',
        min: 0, max: 1, step: 0.01,
        value: props.value || 0,
        onChange,
        style: { width: '100%', cursor: 'pointer', ...base.style },
        disabled: context.inspectMode
      });
    }
  });

  compRegistry.register({
    name: 'RangeSlider',
    allowedParams: { value: 'lambda', onValueChange: 'lambda' },
    requiredParams: ['value', 'onValueChange'],
    render: (props, children, context) => {
      return React.createElement('input', { type: 'range', style: { width: '100%' } });
    }
  });

  // 8. Progress, Tooltips, Chips, Badges & Dividers
  compRegistry.register({
    name: 'LinearProgressIndicator',
    allowedParams: {
      progress: 'float',
      modifier: 'modifier',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const progress = props.progress !== undefined ? props.progress : null;

      const trackStyle: React.CSSProperties = {
        width: '100%',
        height: '4px',
        backgroundColor: 'var(--md-sys-color-surface-variant)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative',
        ...base.style,
      };

      const barStyle: React.CSSProperties = {
        height: '100%',
        backgroundColor: 'var(--md-sys-color-primary)',
        width: progress !== null ? `${progress * 100}%` : '50%',
      };

      return React.createElement('div', { ...base, style: trackStyle },
        React.createElement('div', { style: barStyle })
      );
    }
  });

  compRegistry.register({
    name: 'Badge',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style = {
        position: 'absolute' as const,
        top: '-4px', right: '-4px',
        minWidth: '8px', height: '8px',
        borderRadius: '50%',
        backgroundColor: '#ef4444',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    }
  });

  compRegistry.register({
    name: 'HorizontalDivider',
    allowedParams: { modifier: 'modifier', color: 'color', thickness: 'dp' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const color = props.color ? resolveColor(props.color) : 'var(--md-sys-color-outline)';
      const thickness = props.thickness || 1;
      return React.createElement('div', {
        ...base,
        style: {
          width: '100%',
          height: `${thickness}px`,
          backgroundColor: color,
          margin: '8px 0',
          ...base.style,
        }
      });
    }
  });

  compRegistry.register({
    name: 'VerticalDivider',
    allowedParams: { modifier: 'modifier', color: 'color', thickness: 'dp' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const color = props.color ? resolveColor(props.color) : 'var(--md-sys-color-outline)';
      const thickness = props.thickness || 1;
      return React.createElement('div', {
        ...base,
        style: {
          width: `${thickness}px`,
          height: '100%',
          alignSelf: 'stretch',
          backgroundColor: color,
          margin: '0 8px',
          ...base.style,
        }
      });
    }
  });

  compRegistry.register({
    name: 'Divider',
    allowedParams: { modifier: 'modifier', color: 'color', thickness: 'dp' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const color = props.color ? resolveColor(props.color) : 'var(--md-sys-color-outline)';
      const thickness = props.thickness || 1;
      return React.createElement('div', {
        ...base,
        style: { width: '100%', height: `${thickness}px`, backgroundColor: color, margin: '8px 0', ...base.style }
      });
    }
  });

  const registerChipComponent = (name: string) => {
    compRegistry.register({
      name,
      allowedParams: {
        onClick: 'lambda',
        modifier: 'modifier',
      },
      requiredParams: ['onClick'],
      render: (props, children, context) => {
        const base = defaultPropsAndClass(props, context);
        const style: React.CSSProperties = {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: 'var(--md-sys-color-surface-variant)',
          color: 'var(--md-sys-color-on-surface-variant)',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          border: '1px solid var(--md-sys-color-outline)',
          ...base.style,
        };
        return React.createElement('div', { ...base, style, onClick: props.onClick }, children);
      }
    });
  };

  registerChipComponent('Chip');
  registerChipComponent('AssistChip');
  registerChipComponent('FilterChip');
  registerChipComponent('InputChip');
  registerChipComponent('SuggestionChip');

  compRegistry.register({
    name: 'DropdownMenu',
    allowedParams: { expanded: 'boolean', onDismissRequest: 'lambda' },
    requiredParams: ['expanded', 'onDismissRequest'],
    render: (props, children, context) => {
      const isExpanded = !!props.expanded;
      if (!isExpanded) return null;
      return React.createElement('div', {
        style: {
          position: 'absolute', right: 0, top: '100%',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-outline)',
          color: 'var(--md-sys-color-on-surface)',
          borderRadius: '8px', padding: '8px 0', zIndex: 100, minWidth: '120px'
        }
      }, children);
    }
  });

  compRegistry.register({
    name: 'DatePicker',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const days = Array.from({ length: 30 }, (_, i) => i + 1);
      return React.createElement('div', {
        ...base,
        style: { padding: '16px', backgroundColor: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface)', borderRadius: '16px', width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', ...base.style }
      },
        React.createElement('div', { style: { fontWeight: 'bold', borderBottom: '1px solid var(--md-sys-color-outline)', paddingBottom: '8px' } }, 'June 2026'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '11px' } },
          days.map(d => React.createElement('span', { key: d, style: { padding: '6px 0', cursor: 'pointer', borderRadius: '50%', backgroundColor: d === 30 ? 'var(--md-sys-color-primary)' : 'transparent', color: d === 30 ? 'var(--md-sys-color-on-primary)' : 'inherit' } }, d))
        )
      );
    }
  });

  compRegistry.register({
    name: 'TimePicker',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      return React.createElement('div', {
        ...base,
        style: { padding: '16px', backgroundColor: 'var(--md-sys-color-surface-container-high)', color: 'var(--md-sys-color-on-surface)', borderRadius: '16px', width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', ...base.style }
      },
        React.createElement('div', { style: { fontSize: '28px', fontWeight: 'bold', display: 'flex', gap: '4px' } },
          React.createElement('span', { style: { backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface-variant)', padding: '4px 8px', borderRadius: '4px' } }, '15'),
          React.createElement('span', null, ':'),
          React.createElement('span', { style: { backgroundColor: 'var(--md-sys-color-surface-variant)', color: 'var(--md-sys-color-on-surface-variant)', padding: '4px 8px', borderRadius: '4px' } }, '45')
        )
      );
    }
  });

  compRegistry.register({
    name: 'Tooltip',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      return React.createElement('div', {
        ...base,
        style: { position: 'absolute', backgroundColor: 'var(--md-sys-color-inverse-surface)', color: 'var(--md-sys-color-inverse-on-surface)', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', zIndex: 1000, pointerEvents: 'none', ...base.style }
      }, children);
    }
  });

  compRegistry.register({
    name: 'Snackbar',
    allowedParams: { modifier: 'modifier' },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      return React.createElement('div', {
        ...base,
        style: { position: 'absolute', bottom: '16px', left: '16px', right: '16px', padding: '14px 16px', backgroundColor: 'var(--md-sys-color-inverse-surface)', color: 'var(--md-sys-color-inverse-on-surface)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 999, ...base.style }
      }, children);
    }
  });

  // NavigationBarItem
  compRegistry.register({
    name: 'NavigationBarItem',
    allowedParams: {
      selected: 'boolean',
      onClick: 'lambda',
      icon: 'lambda',
      label: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['selected', 'onClick', 'icon'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const isSelected = !!props.selected;

      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        cursor: 'pointer',
        flex: 1,
        padding: '8px 0',
        userSelect: 'none',
        ...base.style,
      };

      const iconContainerStyle: React.CSSProperties = {
        padding: '4px 16px',
        borderRadius: '16px',
        backgroundColor: isSelected ? 'var(--md-sys-color-secondary-container)' : 'transparent',
        color: isSelected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
      };

      const labelStyle: React.CSSProperties = {
        fontSize: '12px',
        fontWeight: isSelected ? '600' : '400',
        color: isSelected ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
      };

      const onSelect = () => {
        if (context.inspectMode) return;
        if (props.onClick) props.onClick();
      };

      const iconNode = props.icon ? props.icon() : null;
      const labelNode = props.label ? props.label() : null;

      return React.createElement('div', { ...base, style, onClick: onSelect },
        React.createElement('div', { style: iconContainerStyle }, iconNode),
        labelNode && React.createElement('div', { style: labelStyle }, labelNode)
      );
    },
    htmlRender: (props) => {
      const isSelected = !!props.selected;
      const iconBg = isSelected ? 'var(--md-sys-color-secondary-container)' : 'transparent';
      const labelWeight = isSelected ? '600' : '400';
      const labelColor = isSelected ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)';
      return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; flex: 1; cursor: pointer; padding: 8px 0;">
        <div style="padding: 4px 16px; border-radius: 16px; background-color: ${iconBg}; display: flex; align-items: center; justify-content: center;"></div>
        <div style="font-size: 12px; font-weight: ${labelWeight}; color: ${labelColor};"></div>
      </div>`;
    }
  });

  // NavigationRailItem
  compRegistry.register({
    name: 'NavigationRailItem',
    allowedParams: {
      selected: 'boolean',
      onClick: 'lambda',
      icon: 'lambda',
      label: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['selected', 'onClick', 'icon'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const isSelected = !!props.selected;

      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        cursor: 'pointer',
        padding: '12px 0',
        width: '100%',
        userSelect: 'none',
        ...base.style,
      };

      const iconContainerStyle: React.CSSProperties = {
        padding: '4px 12px',
        borderRadius: '16px',
        backgroundColor: isSelected ? 'var(--md-sys-color-secondary-container)' : 'transparent',
        color: isSelected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      };

      const labelStyle: React.CSSProperties = {
        fontSize: '12px',
        color: isSelected ? 'var(--md-sys-color-on-surface)' : 'var(--md-sys-color-on-surface-variant)',
      };

      const onSelect = () => {
        if (context.inspectMode) return;
        if (props.onClick) props.onClick();
      };

      const iconNode = props.icon ? props.icon() : null;
      const labelNode = props.label ? props.label() : null;

      return React.createElement('div', { ...base, style, onClick: onSelect },
        React.createElement('div', { style: iconContainerStyle }, iconNode),
        labelNode && React.createElement('div', { style: labelStyle }, labelNode)
      );
    }
  });

  // NavigationDrawerItem
  compRegistry.register({
    name: 'NavigationDrawerItem',
    allowedParams: {
      selected: 'boolean',
      onClick: 'lambda',
      icon: 'lambda',
      label: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['selected', 'onClick', 'label'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const isSelected = !!props.selected;

      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '12px 24px',
        gap: '12px',
        cursor: 'pointer',
        borderRadius: '100px',
        backgroundColor: isSelected ? 'var(--md-sys-color-secondary-container)' : 'transparent',
        color: isSelected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)',
        userSelect: 'none',
        ...base.style,
      };

      const onSelect = () => {
        if (context.inspectMode) return;
        if (props.onClick) props.onClick();
      };

      const iconNode = props.icon ? props.icon() : null;
      const labelNode = props.label ? props.label() : null;

      return React.createElement('div', { ...base, style, onClick: onSelect },
        iconNode,
        labelNode
      );
    }
  });

  // Tab
  compRegistry.register({
    name: 'Tab',
    allowedParams: {
      selected: 'boolean',
      onClick: 'lambda',
      text: 'string',
      icon: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['selected', 'onClick'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const isSelected = !!props.selected;

      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
        cursor: 'pointer',
        flex: 1,
        gap: '4px',
        userSelect: 'none',
        borderBottom: isSelected ? '2px solid var(--md-sys-color-primary)' : '2px solid transparent',
        color: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
        transition: 'all 0.2s',
        ...base.style,
      };

      const onSelect = () => {
        if (context.inspectMode) return;
        if (props.onClick) props.onClick();
      };

      const iconNode = props.icon ? props.icon() : null;

      return React.createElement('div', { ...base, style, onClick: onSelect },
        iconNode,
        props.text && React.createElement('span', { style: { fontSize: '14px', fontWeight: '500' } }, props.text)
      );
    },
    htmlRender: (props) => {
      const isSelected = !!props.selected;
      const borderBottom = isSelected ? '2px solid var(--md-sys-color-primary)' : '2px solid transparent';
      const color = isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)';
      return `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; padding: 12px 16px; border-bottom: ${borderBottom}; color: ${color}; cursor: pointer;">
        <span style="font-size: 14px; font-weight: 500;">${props.text || ''}</span>
      </div>`;
    }
  });

  // SegmentedButtonRow
  compRegistry.register({
    name: 'SegmentedButtonRow',
    allowedParams: {
      modifier: 'modifier',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row',
        border: '1px solid var(--md-sys-color-outline)',
        borderRadius: '100px',
        overflow: 'hidden',
        width: '100%',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="display: flex; flex-direction: row; border: 1px solid var(--md-sys-color-outline); border-radius: 100px; overflow: hidden; width: 100%; box-sizing: border-box;">${childrenHtml}</div>`;
    }
  });

  // SegmentedButton
  compRegistry.register({
    name: 'SegmentedButton',
    allowedParams: {
      selected: 'boolean',
      onClick: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['selected', 'onClick'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const isSelected = !!props.selected;

      const style: React.CSSProperties = {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 16px',
        cursor: 'pointer',
        userSelect: 'none',
        backgroundColor: isSelected ? 'var(--md-sys-color-secondary-container)' : 'transparent',
        color: isSelected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)',
        borderRight: '1px solid var(--md-sys-color-outline)',
        transition: 'all 0.2s',
        ...base.style,
      };

      const onSegmentClick = () => {
        if (context.inspectMode) return;
        if (props.onClick) props.onClick();
      };

      return React.createElement('div', { ...base, style, onClick: onSegmentClick }, children);
    },
    htmlRender: (props, childrenHtml) => {
      const isSelected = !!props.selected;
      const bg = isSelected ? 'var(--md-sys-color-secondary-container)' : 'transparent';
      const color = isSelected ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface)';
      return `<div style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px 16px; background-color: ${bg}; color: ${color}; border-right: 1px solid var(--md-sys-color-outline); cursor: pointer;">${childrenHtml}</div>`;
    }
  });

  // SearchBar
  compRegistry.register({
    name: 'SearchBar',
    allowedParams: {
      query: 'string',
      onQueryChange: 'lambda',
      placeholder: 'string',
      active: 'boolean',
      modifier: 'modifier',
    },
    requiredParams: ['query', 'onQueryChange'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      
      const style: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        gap: '12px',
        backgroundColor: 'var(--md-sys-color-surface-container-high)',
        borderRadius: '28px',
        width: '100%',
        boxSizing: 'border-box',
        minHeight: '56px',
        ...base.style,
      };

      const inputStyle: React.CSSProperties = {
        flex: 1,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        fontSize: '16px',
        color: 'var(--md-sys-color-on-surface)',
      };

      const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (context.inspectMode) return;
        if (props.onQueryChange) props.onQueryChange(e.target.value);
      };

      return React.createElement('div', { ...base, style },
        React.createElement('span', { style: { fontSize: '18px', color: 'var(--md-sys-color-on-surface-variant)' } }, '🔍'),
        React.createElement('input', {
          type: 'text',
          style: inputStyle,
          placeholder: props.placeholder || 'Search...',
          value: props.query || '',
          onChange,
          disabled: context.inspectMode,
        }),
        children
      );
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="display: flex; align-items: center; padding: 12px 16px; background-color: var(--md-sys-color-surface-container-high); border-radius: 28px; width: 100%; box-sizing: border-box; min-height: 56px;">
        <span style="margin-right: 8px;">🔍</span>
        <input type="text" style="background: transparent; border: none; outline: none; flex: 1; font-size: 16px;" placeholder="${props.placeholder || 'Search...'}" value="${props.query || ''}" />
        ${childrenHtml}
      </div>`;
    }
  });

  // SideSheet
  compRegistry.register({
    name: 'SideSheet',
    allowedParams: {
      modifier: 'modifier',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        width: '360px',
        height: '100%',
        backgroundColor: 'var(--md-sys-color-surface)',
        color: 'var(--md-sys-color-on-surface)',
        borderLeft: '1px solid var(--md-sys-color-outline)',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="display: flex; flex-direction: column; width: 360px; height: 100%; background-color: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); border-left: 1px solid var(--md-sys-color-outline); box-sizing: border-box;">${childrenHtml}</div>`;
    }
  });

  // FullScreenDialog
  compRegistry.register({
    name: 'FullScreenDialog',
    allowedParams: {
      onDismissRequest: 'lambda',
      modifier: 'modifier',
    },
    requiredParams: ['onDismissRequest'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'var(--md-sys-color-background)',
        color: 'var(--md-sys-color-on-background)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="position: absolute; inset: 0; background-color: var(--md-sys-color-background); color: var(--md-sys-color-on-background); display: flex; flex-direction: column; z-index: 1000; box-sizing: border-box;">${childrenHtml}</div>`;
    }
  });

  // MATERIALTHEME
  compRegistry.register({
    name: 'MaterialTheme',
    allowedParams: {
      colorScheme: 'enum',
      typography: 'enum',
      theme: 'string',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const isDarkTheme = props.theme === 'dark' || (props.colorScheme && props.colorScheme.isDark);
      const className = isDarkTheme ? 'theme-dark' : '';
      
      const styleOverrides: Record<string, string> = {};
      if (props.colorScheme && typeof props.colorScheme === 'object') {
        Object.entries(props.colorScheme).forEach(([key, val]) => {
          if (typeof val === 'string' && key !== 'isDark') {
            styleOverrides[`--md-sys-color-${key}`] = val;
          }
        });
      }

      return React.createElement('div', {
        className,
        style: {
          display: 'contents',
          ...styleOverrides
        }
      }, children);
    },
    htmlRender: (props, childrenHtml) => {
      const isDarkTheme = props.theme === 'dark' || (props.colorScheme && props.colorScheme.isDark);
      const classNameAttr = isDarkTheme ? ' class="theme-dark"' : '';
      return `<div${classNameAttr} style="display: contents;">${childrenHtml}</div>`;
    }
  });
}
