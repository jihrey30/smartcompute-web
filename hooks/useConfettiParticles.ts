import { useState, useEffect } from 'react';

export interface Particle {
  x: number;
  duration: number;
  delay: number;
  scaleMax: number;
  rotate: number;
  size: number;
}

export function useConfettiParticles(isComplete: boolean) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (isComplete) {
      setTimeout(() => {
        setParticles(
          Array.from({ length: 15 }).map(() => ({
            x: Math.random() * 100,
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 2,
            scaleMax: Math.random() + 0.6,
            rotate: Math.random() * 360,
            size: Math.random() * 16 + 8,
          }))
        );
      }, 0);
    } else {
      setParticles([]);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [isComplete]);

  return particles;
}
