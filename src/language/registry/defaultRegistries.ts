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
    },
    requiredParams: ['text'],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        color: props.color ? resolveColor(props.color) : 'inherit',
        fontSize: props.fontSize ? `${props.fontSize}px` : 'inherit',
        fontWeight: props.fontWeight || 'inherit',
        fontStyle: props.fontStyle || 'inherit',
        textAlign: props.textAlign || 'inherit',
        textDecoration: props.textDecoration || 'inherit',
        margin: 0,
        ...base.style,
      };
      return React.createElement('p', { ...base, style }, props.text || '');
    },
    htmlRender: (props) => {
      return `<p style="margin: 0; color: ${props.color ? resolveColor(props.color) : 'inherit'}; font-size: ${props.fontSize ? props.fontSize + 'px' : 'inherit'};">${props.text || ''}</p>`;
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
        backgroundColor: props.color ? resolveColor(props.color) : 'rgba(255, 255, 255, 0.1)',
        width: '100%',
        margin: 0,
        ...base.style,
      };
      return React.createElement('hr', { ...base, style });
    },
    htmlRender: (props) => {
      return `<hr style="border: none; height: ${props.thickness || 1}px; background-color: ${props.color ? resolveColor(props.color) : 'rgba(255,255,255,0.1)'}; width: 100%; margin: 0;" />`;
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
        padding: '8px 16px',
        backgroundColor: '#3b82f6', // Indigo Blue 500
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
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
      return `<button style="padding: 8px 16px; background-color: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">${childrenHtml}</button>`;
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
        padding: '10px 12px',
        borderRadius: '6px',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        color: '#f8fafc',
        fontSize: '14px',
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
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                fontSize: '14px',
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
      return `<input type="text" value="${props.value || ''}" placeholder="${placeholderText}" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ccc;" />`;
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
        width: '44px',
        height: '24px',
        backgroundColor: isChecked ? '#10b981' : '#475569',
        borderRadius: '12px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 2px',
        boxSizing: 'border-box',
        ...base.style,
      };

      const thumbStyle: React.CSSProperties = {
        width: '20px',
        height: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '50%',
        position: 'absolute',
        left: isChecked ? '22px' : '2px',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
      return `<div style="width: 44px; height: 24px; background-color: ${isChecked ? '#10b981' : '#475569'}; border-radius: 12px; display: inline-flex; align-items: center; position: relative;">
        <div style="width: 20px; height: 20px; background-color: white; border-radius: 50%; position: absolute; left: ${isChecked ? '22px' : '2px'};"></div>
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
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">${childrenHtml}</div>`;
    },
  });

  // SURFACE
  compRegistry.register({
    name: 'Surface',
    allowedParams: {
      modifier: 'modifier',
    },
    requiredParams: [],
    render: (props, children, context) => {
      const base = defaultPropsAndClass(props, context);
      const style: React.CSSProperties = {
        boxSizing: 'border-box',
        ...base.style,
      };
      return React.createElement('div', { ...base, style }, children);
    },
    htmlRender: (props, childrenHtml) => {
      return `<div style="box-sizing: border-box;">${childrenHtml}</div>`;
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
      const color = props.color ? resolveColor(props.color) : '#3b82f6';
      
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
      const color = props.color ? resolveColor(props.color) : '#3b82f6';
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
  registerBoxContainer('ElevatedCard', { borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: '16px', backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.05)' });
  registerBoxContainer('OutlinedCard', { borderRadius: '12px', border: '1px solid #475569', padding: '16px', backgroundColor: 'transparent' });

  // 2. Structural & Layout containers
  registerBoxContainer('NavigationBar', { height: '80px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#0f172a', borderTop: '1px solid #334155' });
  registerBoxContainer('NavigationRail', { width: '80px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#0f172a', borderRight: '1px solid #334155' });
  registerBoxContainer('NavigationDrawer', { width: '280px', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', borderRight: '1px solid #334155', padding: '16px' });
  registerBoxContainer('NavigationSuite', { display: 'flex', width: '100%', height: '100%' });

  // 3. Headers & Footers
  registerBoxContainer('TopAppBar', { height: '64px', display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', fontWeight: 'bold' }, 'header');
  registerBoxContainer('CenterAlignedTopAppBar', { height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', fontWeight: 'bold' }, 'header');
  registerBoxContainer('LargeTopAppBar', { height: '128px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', fontWeight: 'bold' }, 'header');
  registerBoxContainer('MediumTopAppBar', { height: '96px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '16px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', fontWeight: 'bold' }, 'header');
  registerBoxContainer('BottomAppBar', { height: '80px', display: 'flex', alignItems: 'center', padding: '0 16px', backgroundColor: '#1e293b', borderTop: '1px solid #334155' }, 'footer');

  // 4. List Items & Badges
  registerBoxContainer('ListItem', { display: 'flex', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '16px' });
  registerBoxContainer('BadgeBox', { position: 'relative', display: 'inline-flex' });
  registerBoxContainer('ExposedDropdownMenuBox', { position: 'relative', display: 'inline-block', width: '100%' });

  // Tab rows & scrolling elements
  registerBoxContainer('TabRow', { display: 'flex', flexDirection: 'row', width: '100%', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' });
  registerBoxContainer('ScrollableTabRow', { display: 'flex', flexDirection: 'row', width: '100%', overflowX: 'auto', borderBottom: '1px solid #334155', backgroundColor: '#0f172a' });
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
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          border: 'none',
          borderRadius: '6px',
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
        return `<button style="padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer;">${childrenHtml}</button>`;
      }
    });
  };

  registerButtonType('ElevatedButton', { boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#334155' });
  registerButtonType('FilledTonalButton', { backgroundColor: '#475569', color: '#f8fafc' });
  registerButtonType('OutlinedButton', { border: '1px solid #475569', backgroundColor: 'transparent', color: '#38bdf8' });
  registerButtonType('TextButton', { backgroundColor: 'transparent', color: '#38bdf8' });
  registerButtonType('IconButton', { padding: '8px', borderRadius: '50%', minWidth: 'auto', backgroundColor: 'transparent', color: '#dfe1e5' });
  registerButtonType('FilledIconButton', { padding: '8px', borderRadius: '50%', minWidth: 'auto', backgroundColor: '#3b82f6' });
  registerButtonType('OutlinedIconButton', { padding: '8px', borderRadius: '50%', minWidth: 'auto', border: '1px solid #475569', backgroundColor: 'transparent', color: '#dfe1e5' });
  registerButtonType('FloatingActionButton', { padding: '16px', borderRadius: '16px', backgroundColor: '#38bdf8', color: '#0f172a', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontWeight: 'bold' });
  registerButtonType('ExtendedFloatingActionButton', { padding: '16px 24px', borderRadius: '16px', backgroundColor: '#38bdf8', color: '#0f172a', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', fontWeight: 'bold' });

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
        backgroundColor: '#0f172a',
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
              backgroundColor: '#1e293b',
              borderRadius: '28px',
              padding: '24px',
              maxWidth: '320px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }
          },
          titleNode && React.createElement('div', { style: { fontSize: '20px', fontWeight: '500', color: '#f8fafc' } }, titleNode),
          textNode && React.createElement('div', { style: { fontSize: '14px', color: '#94a3b8', lineHeight: '1.5' } }, textNode),
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
      return React.createElement('div', { style: { padding: '16px', borderRadius: '12px', border: '1px solid #ccc' } }, children);
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
            backgroundColor: '#1e293b',
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
        border: '1.5px solid #475569',
        color: '#f8fafc',
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
          React.createElement('div', { style: { fontSize: '12px', color: '#38bdf8', paddingLeft: '4px' } }, props.label()),
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
        padding: '10px 12px',
        borderRadius: '6px',
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        color: '#f8fafc',
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
        border: `2px solid ${isSelected ? '#38bdf8' : '#64748b'}`,
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
        backgroundColor: '#38bdf8',
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
        backgroundColor: '#334155',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative',
        ...base.style,
      };

      const barStyle: React.CSSProperties = {
        height: '100%',
        backgroundColor: '#38bdf8',
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
      const color = props.color ? resolveColor(props.color) : 'rgba(255,255,255,0.12)';
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
      const color = props.color ? resolveColor(props.color) : 'rgba(255,255,255,0.12)';
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
      const color = props.color ? resolveColor(props.color) : 'rgba(255,255,255,0.12)';
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
          backgroundColor: '#334155',
          color: '#f8fafc',
          fontSize: '12px',
          fontWeight: '500',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.1)',
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
          backgroundColor: '#1e293b', border: '1px solid #334155',
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
        style: { padding: '16px', backgroundColor: '#1e293b', borderRadius: '16px', width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', ...base.style }
      },
        React.createElement('div', { style: { fontWeight: 'bold', borderBottom: '1px solid #475569', paddingBottom: '8px' } }, 'June 2026'),
        React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '11px' } },
          days.map(d => React.createElement('span', { key: d, style: { padding: '6px 0', cursor: 'pointer', borderRadius: '50%', backgroundColor: d === 30 ? '#38bdf8' : 'transparent', color: d === 30 ? '#0f172a' : 'inherit' } }, d))
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
        style: { padding: '16px', backgroundColor: '#1e293b', borderRadius: '16px', width: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', ...base.style }
      },
        React.createElement('div', { style: { fontSize: '28px', fontWeight: 'bold', display: 'flex', gap: '4px' } },
          React.createElement('span', { style: { backgroundColor: '#334155', padding: '4px 8px', borderRadius: '4px' } }, '15'),
          React.createElement('span', null, ':'),
          React.createElement('span', { style: { backgroundColor: '#334155', padding: '4px 8px', borderRadius: '4px' } }, '45')
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
        style: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', zIndex: 1000, pointerEvents: 'none', ...base.style }
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
        style: { position: 'absolute', bottom: '16px', left: '16px', right: '16px', padding: '14px 16px', backgroundColor: '#334155', color: '#f8fafc', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 999, ...base.style }
      }, children);
    }
  });
}
