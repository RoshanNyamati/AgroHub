import { useState } from 'react';
import { Tractor } from 'lucide-react';

interface EquipmentPhotoProps {
  src: string;
  alt: string;
  className?: string;
}

export function EquipmentPhoto({ src, alt, className = '' }: EquipmentPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-50 p-4 text-emerald-900 dark:from-emerald-950/80 dark:via-slate-900 dark:to-slate-950 dark:text-emerald-200 ${className}`}
      >
        <Tractor className="h-10 w-10 opacity-80" aria-hidden="true" />
        <span className="text-center text-xs font-semibold">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
