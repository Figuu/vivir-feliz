"use client";

import { useEffect, useRef, useCallback } from "react";

import confetti, { type Options } from "canvas-confetti";

export interface ConfettiRef {
  fire: (options?: Options) => void;
}

interface ConfettiProps {
  manualstart?: boolean;
  options?: Options;
  className?: string;
  globalOptions?: Options;
  onFire?: () => void;
}

const Confetti = ({
  manualstart = false,
  options,
  className,
  globalOptions = {},
  onFire,
  ...props
}: ConfettiProps & React.ComponentProps<"canvas">) => {
  const instanceRef = useRef<confetti.CreateTypes | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fire = useCallback((opts = {} as Options) => {
    if (instanceRef.current) {
      instanceRef.current({
        ...options,
        ...opts,
      });
    }
    onFire?.();
  }, [options, onFire]);

  useEffect(() => {
    if (!canvasRef.current) return;

    instanceRef.current = confetti.create(canvasRef.current, {
      ...globalOptions,
    });
  }, [globalOptions]);

  useEffect(() => {
    if (!manualstart) {
      fire();
    }
  }, [manualstart, options, fire]);

  // Expose fire method via ref
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as HTMLCanvasElement & { fire?: (opts?: Options) => void }).fire = fire;
    }
  }, [fire]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      {...props}
    />
  );
};

// Helper hook for easier usage
export const useConfetti = () => {
  const fire = (options?: Options) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      ...options,
    });
  };

  return { fire };
};

export { Confetti };