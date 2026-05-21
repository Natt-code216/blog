import { Hero } from '../components/Hero';
import { Essays } from '../components/Essays';
import { Tutorials } from '../components/Tutorials';
import { Tools } from '../components/Tools';

export function HomePage() {
  return (
    <main>
      <Hero />
      <Essays />
      <Tutorials />
      <Tools />
    </main>
  );
}
