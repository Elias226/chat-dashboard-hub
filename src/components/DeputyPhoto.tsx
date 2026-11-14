import { useState } from "react";
import { UserRound } from "lucide-react";

interface DeputyPhotoProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

const DeputyPhoto = ({ src, name, className = "" }: DeputyPhotoProps) => {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <div className={`shrink-0 overflow-hidden rounded-xl bg-[#17324D]/5 ${className}`}>
      {src && failedSource !== src ? (
        <img src={src} alt={name ? `Fotografia oficial de ${name}` : "Fotografia oficial do parlamentar"} loading="lazy" className="h-full w-full object-cover object-top" onError={() => setFailedSource(src)} />
      ) : (
        <div role="img" aria-label="Fotografia não disponível" className="flex h-full w-full items-center justify-center text-[#167D8D]"><UserRound aria-hidden="true" className="h-10 w-10" /></div>
      )}
    </div>
  );
};

export default DeputyPhoto;
