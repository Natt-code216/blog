import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toolboxHref } from '../../services/toolCatalog';

/** The directory is a separate Vite document, so a client-side Navigate cannot load it. */
export function ToolboxRedirect() {
  const { search, hash } = useLocation();
  const href = `${toolboxHref}${search}${hash}`;

  useEffect(() => { window.location.replace(href); }, [href]);

  return <p className="container">正在打开<a href={href}>实用工具集</a>…</p>;
}
