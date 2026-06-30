import React from 'react';

// Common interfaces
export type ParamType =
  | 'string'
  | 'number'
  | 'float'
  | 'dp'
  | 'sp'
  | 'color'
  | 'enum'
  | 'boolean'
  | 'modifier'
  | 'lambda';

export interface ComponentSpec {
  name: string;
  allowedParams: Record<string, ParamType>;
  requiredParams: string[];
  defaultParams?: Record<string, any>;
  render: (props: any, children: React.ReactNode, context: any) => React.ReactNode;
  htmlRender?: (props: any, childrenHtml: string) => string;
  description?: string;
  snippet?: string;
  parameterDocs?: Record<string, string>;
}

export interface ModifierSpec {
  name: string;
  paramTypes: ParamType[];
  toCSS: (args: any[], namedArgs?: Record<string, any>) => Record<string, string>;
  description?: string;
  snippet?: string;
  parameterDocs?: Record<string, string>;
}

export class ComponentRegistry {
  private static instance: ComponentRegistry;
  private registry: Map<string, ComponentSpec> = new Map();

  private constructor() {}

  public static getInstance(): ComponentRegistry {
    if (!ComponentRegistry.instance) {
      ComponentRegistry.instance = new ComponentRegistry();
    }
    return ComponentRegistry.instance;
  }

  public register(spec: ComponentSpec): void {
    this.registry.set(spec.name, spec);
  }

  public get(name: string): ComponentSpec | undefined {
    return this.registry.get(name);
  }

  public has(name: string): boolean {
    return this.registry.has(name);
  }

  public getAll(): ComponentSpec[] {
    return Array.from(this.registry.values());
  }

  public clear(): void {
    this.registry.clear();
  }
}

export class ModifierRegistry {
  private static instance: ModifierRegistry;
  private registry: Map<string, ModifierSpec> = new Map();

  private constructor() {}

  public static getInstance(): ModifierRegistry {
    if (!ModifierRegistry.instance) {
      ModifierRegistry.instance = new ModifierRegistry();
    }
    return ModifierRegistry.instance;
  }

  public register(spec: ModifierSpec): void {
    this.registry.set(spec.name, spec);
  }

  public get(name: string): ModifierSpec | undefined {
    return this.registry.get(name);
  }

  public has(name: string): boolean {
    return this.registry.has(name);
  }

  public getAll(): ModifierSpec[] {
    return Array.from(this.registry.values());
  }

  public clear(): void {
    this.registry.clear();
  }
}
