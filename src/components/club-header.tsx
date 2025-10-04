'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from './ui/button';

interface ClubHeaderProps {
  clubName: string;
  clubLogo?: string | null;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ClubHeader({
  clubName,
  clubLogo,
  title,
  showBack = false,
  backHref,
  actions,
  primaryColor,
  secondaryColor,
}: ClubHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-club-gradient shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Left side: Back button or Logo */}
        <div className="flex items-center gap-4">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {clubLogo ? (
            <div className="relative h-10 w-10">
              <Image
                src={clubLogo}
                alt={clubName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : null}

          <div className="flex flex-col">
            <span className="text-sm font-medium text-white/90">
              {clubName}
            </span>
            {title && (
              <span className="text-lg font-semibold text-white">{title}</span>
            )}
          </div>
        </div>

        {/* Right side: Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <style jsx>{`
        header {
          background: linear-gradient(
            135deg,
            ${primaryColor || 'hsl(221.2, 83.2%, 53.3%)'} 0%,
            ${secondaryColor || 'hsl(142, 76%, 36%)'} 100%
          );
        }
      `}</style>
    </header>
  );
}
