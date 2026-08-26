'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
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
    sm: { text: 'text-base', box: 'w-8 h-8' },
    md: { text: 'text-xl', box: 'w-10 h-10' },
    lg: { text: 'text-2xl', box: 'w-14 h-14' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${currentSize.box} rounded-2xl overflow-hidden shrink-0 flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="TáMarcado Logo"
          className="w-full h-full object-contain transform scale-110"
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

