'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  href?: string;
  className?: string;
}

export function Logo({
  size = 'md',
  showText = true,
  href,
  className = '',
}: LogoProps) {
  const sizeMap = {
    sm: { text: 'text-base', box: 'w-10 h-10', scale: 'scale-130' },
    md: { text: 'text-xl font-black', box: 'w-16 h-16', scale: 'scale-140' },
    lg: { text: 'text-2xl font-black', box: 'w-24 h-24 sm:w-28 sm:h-28', scale: 'scale-145' },
    xl: { text: 'text-3xl font-black', box: 'w-32 h-32 sm:w-36 sm:h-36', scale: 'scale-155' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-1 sm:gap-1.5 ${className}`}>
      <div className={`relative ${currentSize.box} shrink-0 flex items-center justify-center -mr-1`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="TáMarcado Logo"
          className={`w-full h-full object-contain transform ${currentSize.scale} drop-shadow-xs`}
        />
      </div>

      {showText && (
        <span className={`tracking-tight text-zinc-900 dark:text-zinc-100 ${currentSize.text}`}>
          TáMarcado
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

