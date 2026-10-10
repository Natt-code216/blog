import { ambientOrbitMarkup } from './markup';
import './ambient-orbit.css';

export function AmbientOrbit() {
  return <div className="ambient-orbit" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ambientOrbitMarkup }} />;
}
