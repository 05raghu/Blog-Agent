// Safe JSX renderer for Gen UI components
// Validates and safely renders Claude-generated JSX

import React from 'react';

// Allowlist of safe components that Gen UI can generate
const SAFE_COMPONENTS = {
  'div': true,
  'p': true,
  'span': true,
  'h1': true,
  'h2': true,
  'h3': true,
  'h4': true,
  'h5': true,
  'h6': true,
  'button': true,
  'a': true,
  'ul': true,
  'ol': true,
  'li': true,
  'table': true,
  'thead': true,
  'tbody': true,
  'tr': true,
  'td': true,
  'th': true,
  'section': true,
  'article': true,
  'header': true,
  'footer': true,
  'main': true,
  'nav': true,
  'figure': true,
  'figcaption': true,
  'img': true,
  'svg': true,
  'path': true,
  'circle': true,
  'rect': true,
  'text': true,
  'line': true,
  'polyline': true,
};

// Allowlist of safe HTML attributes
const SAFE_ATTRIBUTES = {
  'className': true,
  'id': true,
  'title': true,
  'data-testid': true,
  'aria-label': true,
  'aria-describedby': true,
  'role': true,
  'tabIndex': true,
  'onClick': true,
  'onMouseEnter': true,
  'onMouseLeave': true,
  'onFocus': true,
  'onBlur': true,
  'style': true,
  'src': true,
  'alt': true,
  'href': true,
  'target': true,
  'rel': true,
  'type': true,
  'placeholder': true,
  'value': true,
  'disabled': true,
  'enabled': true,
  'checked': true,
  'rowSpan': true,
  'colSpan': true,
  'viewBox': true,
  'fill': true,
  'stroke': true,
  'strokeWidth': true,
  'd': true,
  'cx': true,
  'cy': true,
  'r': true,
  'x': true,
  'y': true,
  'width': true,
  'height': true,
  'x1': true,
  'y1': true,
  'x2': true,
  'y2': true,
};

interface SafeComponentProps {
  [key: string]: any;
}

/**
 * Validates a component name against the allowlist
 */
function isComponentSafe(componentName: string): boolean {
  return SAFE_COMPONENTS[componentName as keyof typeof SAFE_COMPONENTS] === true;
}

/**
 * Validates an attribute name against the allowlist
 */
function isAttributeSafe(attrName: string): boolean {
  if (attrName.startsWith('on') && attrName.length > 2) {
    return /^on[A-Z]/.test(attrName);
  }
  return SAFE_ATTRIBUTES[attrName as keyof typeof SAFE_ATTRIBUTES] === true;
}

/**
 * Sanitizes props to remove potentially dangerous attributes
 */
function sanitizeProps(props: SafeComponentProps): SafeComponentProps {
  const sanitized: SafeComponentProps = {};

  for (const [key, value] of Object.entries(props)) {
    if (!isAttributeSafe(key)) {
      console.warn(`Skipping unsafe attribute: ${key}`);
      continue;
    }

    // Validate URLs
    if ((key === 'href' || key === 'src') && typeof value === 'string') {
      if (!isUrlSafe(value)) {
        console.warn(`Skipping unsafe URL: ${value}`);
        continue;
      }
    }

    // Validate onclick handlers (only allow known callbacks)
    if (key.startsWith('on') && typeof value !== 'function') {
      console.warn(`Invalid event handler: ${key}`);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Validates URLs to prevent javascript: and data: protocols
 */
function isUrlSafe(url: string): boolean {
  try {
    const lowerUrl = url.toLowerCase().trim();
    if (lowerUrl.startsWith('javascript:')) return false;
    if (lowerUrl.startsWith('data:')) return false;
    if (lowerUrl.startsWith('vbscript:')) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * SafeComponent wrapper for rendering Gen UI components
 * Usage: <SafeComponent component={parsedJSX} />
 */
export function SafeComponent({
  component,
  fallback = null,
}: {
  component: any;
  fallback?: React.ReactNode;
}) {
  try {
    if (!component) {
      return fallback;
    }

    // If it's already a React component, render it
    if (React.isValidElement(component)) {
      return component;
    }

    // If it's a function component, render it
    if (typeof component === 'function') {
      return <component />;
    }

    return fallback;
  } catch (error) {
    console.error('Error rendering safe component:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-800">Failed to render component</p>
      </div>
    );
  }
}

/**
 * Parses a JSX string and returns a React component
 * This is a simplified version - for production, use @babel/parser
 */
export function parseGenUIJSX(jsxString: string): React.ComponentType<any> | null {
  try {
    // This is a placeholder - in production, use Babel to parse JSX safely
    // For now, we'll just validate that it doesn't contain dangerous patterns

    const dangerousPatterns = [
      'eval(',
      'Function(',
      'setTimeout(',
      'setInterval(',
      'fetch(',
      'XMLHttpRequest',
      'window.',
      'document.',
      'innerHTML',
      'dangerouslySetInnerHTML',
    ];

    for (const pattern of dangerousPatterns) {
      if (jsxString.includes(pattern)) {
        console.warn(`Dangerous pattern detected: ${pattern}`);
        return null;
      }
    }

    // Return a component that displays the JSX as code
    // In production, use @babel/parser to actually parse and compile
    return () => (
      <div className="p-4 bg-slate-900 rounded-lg">
        <pre className="text-slate-100 text-xs overflow-x-auto">
          {jsxString}
        </pre>
      </div>
    );
  } catch (error) {
    console.error('Error parsing JSX:', error);
    return null;
  }
}

/**
 * Component error boundary for safe rendering
 */
export class GenUIErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Gen UI rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-900">Error rendering dashboard</h3>
          <p className="text-sm text-red-800 mt-2">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
