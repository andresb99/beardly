'use client';

import { useEffect } from 'react';

export function AdminLayoutEffects() {
  useEffect(() => {
    // Hide body scroll when in admin panel to ensure the inner scroll takes over perfectly
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return null;
}
