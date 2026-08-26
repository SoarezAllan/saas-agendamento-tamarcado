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
    sm: { img: 28, text: 'text-base', box: 'w-7 h-7' },
    md: { img: 36, text: 'text-xl', box: 'w-9 h-9' },
    lg: { img: 48, text: 'text-2xl', box: 'w-12 h-12' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${currentSize.box} rounded-xl overflow-hidden shadow-xs shrink-0 flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="TáMarcado Logo"
          className="w-full h-full object-contain"
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
