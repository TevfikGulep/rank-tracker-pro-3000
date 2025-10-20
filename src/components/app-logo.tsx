import { Layers } from 'lucide-react';
import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2" aria-label="Rank Tracker Pro Logo">
      <div className="bg-primary text-primary-foreground p-2 rounded-md">
        <Layers className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold text-foreground">Rank Tracker Pro</span>
    </div>
  );
}
