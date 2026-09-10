import React from 'react';

export function parseTextWithLinks(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      // Check if YouTube
      const ytMatch = part.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (ytMatch && ytMatch[1]) {
        return (
          <span key={i} className="block my-2 w-full max-w-sm overflow-hidden rounded-xl border border-foreground/10 bg-background/50">
            <a href={part} target="_blank" rel="noreferrer" className="text-liquid-accent hover:underline text-xs p-2 block truncate">{part}</a>
            <iframe 
              width="100%" 
              height="200" 
              src={`https://www.youtube.com/embed/${ytMatch[1]}`} 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
              className="w-full object-cover"
            />
          </span>
        );
      }
      return <a key={i} href={part} target="_blank" rel="noreferrer" className="text-liquid-accent hover:underline break-words" onClick={e => e.stopPropagation()}>{part}</a>;
    }
    return <span key={i} className="whitespace-pre-wrap break-words">{part}</span>;
  });
}

