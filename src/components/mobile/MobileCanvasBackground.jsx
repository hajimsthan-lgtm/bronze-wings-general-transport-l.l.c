import React from 'react';
import { useTheme } from '@/lib/theme';
import SpaceBackground from './SpaceBackground';
import DaySkyBackground from './DaySkyBackground';

export default function MobileCanvasBackground() {
  const { mode } = useTheme();
  return (
    <div className="md:hidden">
      {mode === 'dark' ? <SpaceBackground /> : <DaySkyBackground />}
    </div>
  );
}