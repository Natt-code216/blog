import { Hero } from '../features/home/Hero';
import { Essays } from '../features/essays/Essays';
import { Tutorials } from '../features/tutorials/Tutorials';
import { Tools } from '../features/tools/Tools';
import { CollectionGateway } from '../features/collection/CollectionGateway';

export function HomePage() {
  return (
    <div className="homePage">
      <Hero />
      <Essays />
      <Tutorials />
      <Tools />
      <CollectionGateway />
    </div>
  );
}
