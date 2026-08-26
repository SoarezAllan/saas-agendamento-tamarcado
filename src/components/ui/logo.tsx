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
    sm: { text: 'text-lg', box: 'w-10 h-10', scale: 'scale-125' },
    md: { text: 'text-2xl sm:text-3xl', box: 'w-14 h-14 sm:w-16 sm:h-16', scale: 'scale-135' },
    lg: { text: 'text-3xl sm:text-4xl', box: 'w-24 h-24 sm:w-28 sm:h-28', scale: 'scale-140' },
    xl: { text: 'text-4xl sm:text-5xl', box: 'w-32 h-32 sm:w-36 sm:h-36', scale: 'scale-150' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative ${currentSize.box} shrink-0 flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="TáMarcado Logo"
          className={`w-full h-full object-contain transform ${currentSize.scale} drop-shadow-xs`}
        />
      </div>

      {showText && (
        <span className={`font-black tracking-tight text-zinc-900 dark:text-zinc-100 ${currentSize.text}`}>
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

