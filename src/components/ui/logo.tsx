'use client';

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  className?: string;
}

export function Logo({
  size = 'md',
  href,
  className = '',
}: LogoProps) {
  const sizeMap = {
    sm: {
      box: 'h-6 sm:h-7 w-auto',
      imgClass: 'h-6 sm:h-7 w-auto object-contain',
    },
    md: {
      box: 'h-8 sm:h-9 w-auto',
      imgClass: 'h-8 sm:h-9 w-auto object-contain',
    },
    lg: {
      box: 'h-10 sm:h-12 w-auto',
      imgClass: 'h-10 sm:h-12 w-auto object-contain',
    },
    xl: {
      box: 'h-14 sm:h-16 w-auto',
      imgClass: 'h-14 sm:h-16 w-auto object-contain',
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center ${className}`}>
      <div className={`relative ${currentSize.box} shrink-0 flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Tá Marcado"
          className={`${currentSize.imgClass} dark:bg-white dark:rounded-lg dark:px-2 dark:py-0.5 transition-all`}
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-90 transition-opacity inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
