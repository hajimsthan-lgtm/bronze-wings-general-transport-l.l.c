import React from 'react';

export default function GmailIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-2V8.3L12 13.3 5.5 8.3V20h-2A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4h.6L12 9.7 19.9 4h.6A1.5 1.5 0 0 1 22 5.5Z" fill="#EA4335"/>
      <path d="M5.5 8.3V20H3.5A1.5 1.5 0 0 1 2 18.5v-13A1.5 1.5 0 0 1 3.5 4h.6L12 9.7 5.5 8.3Z" fill="#FBBC04"/>
      <path d="M2 5.5v13A1.5 1.5 0 0 0 3.5 20h2V8.3L2 5.5Z" fill="#C5221F"/>
      <path d="M18.5 8.3 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-2V8.3Z" fill="#34A853"/>
    </svg>
  );
}