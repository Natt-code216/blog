import { toolboxHref } from '../../../services/toolCatalog';

// Carry only the directory's filter; return destinations never come from a URL parameter.
export function withToolQuery(href: string, query: string): string {
  const value = query.trim();
  return value ? `${href}?${new URLSearchParams({ q: value })}` : href;
}

export function getToolboxReturnHref(search: string): string {
  return withToolQuery(toolboxHref, new URLSearchParams(search).get('q') ?? '');
}
