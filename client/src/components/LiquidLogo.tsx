"use client";

import React from 'react';

interface LiquidLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
  showText?: boolean;
  textClassName?: string;
  badgeText?: string;
}

export default function LiquidLogo({
  size = 40,
  className = '',
  glow = true,
  showText = false,
  textClassName = '',
  badgeText
}: LiquidLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative shrink-0 select-none flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ width: size, height: size }}
      >
        {/* Ambient Glow */}
        {glow && (
          <div 
            className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#ff4b82] via-[#a855f7] to-[#00f2fe] opacity-50 blur-lg pointer-events-none -z-10 animate-pulse"
          />
        )}
        <svg 
          viewBox="0 0 512 512" 
          width={size} 
          height={size} 
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id={`liquidGrad_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff4b82" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#00f2fe" />
            </linearGradient>
            <linearGradient id={`dropletCore_${size}`} x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#ff7597" />
              <stop offset="60%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id={`glassReflect_${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Outer Squircle Glass Shell */}
          <rect 
            x="36" 
            y="36" 
            width="440" 
            height="440" 
            rx="120" 
            fill="#0c0a18" 
            stroke={`url(#liquidGrad_${size})`} 
            strokeWidth="8" 
          />
          <rect 
            x="44" 
            y="44" 
            width="424" 
            height="424" 
            rx="112" 
            fill="none" 
            stroke="rgba(255,255,255,0.12)" 
            strokeWidth="3" 
          />

          {/* Main Droplet Body */}
          <path 
            d="M256,92 C320,165 375,230 375,302 C375,372 322,422 256,422 C190,422 137,372 137,302 C137,230 192,165 256,92 Z" 
            fill={`url(#dropletCore_${size})`} 
          />

          {/* Reflection */}
          <path 
            d="M256,112 C295,165 348,225 352,290 C332,270 295,258 256,260 C217,258 180,270 160,290 C164,225 217,165 256,112 Z" 
            fill={`url(#glassReflect_${size})`} 
          />

          {/* Stylized Cyber Ripple Node */}
          <path 
            d="M210,285 C230,265 282,265 302,285 C316,299 316,325 302,339 C292,349 270,356 256,370 C242,356 220,349 210,339 C196,325 196,299 210,285 Z" 
            fill="#ffffff" 
            opacity="0.95"
          />

          {/* Center Glowing Particle */}
          <circle cx="256" cy="312" r="14" fill="#a855f7" />
          <circle cx="256" cy="312" r="7" fill="#ffffff" />

          {/* Sakura Specular Accents */}
          <path 
            d="M360,150 Q360,180 375,180 Q360,180 360,210 Q360,180 345,180 Q360,180 360,150 Z" 
            fill="#ff7597" 
            opacity="0.95"
          />
          <circle cx="360" cy="180" r="3.5" fill="#ffffff" />

          <path 
            d="M152,360 Q152,375 160,375 Q152,375 152,390 Q152,375 144,375 Q152,375 152,360 Z" 
            fill="#00f2fe" 
            opacity="0.9"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-black tracking-tight text-white ${textClassName || 'text-lg'}`}>
              LiquidChat
            </span>
            {badgeText && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[#ff7597]/20 border border-[#ff7597]/40 text-[#ff7597]">
                {badgeText}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

