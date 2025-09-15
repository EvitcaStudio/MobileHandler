declare module './vendor/utils.min.mjs' {
  export const Utils: {
    clamp: (value: number, min: number, max: number) => number;
    getDistance: (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => number;
    getAngle: (pos1: { x: number; y: number }, pos2: { x: number; y: number }) => number;
    calculateNewPositionFromDistanceAndAngle: (pos: { x: number; y: number }, distance: number, angle: number) => { x: number; y: number };
    convertRaWAngleToVyloCoords: (angle: number) => number;
    normalizeRanged: (value: number, min: number, max: number) => number;
  };
}

declare module './vendor/logger.min.mjs' {
  export class Logger {
    registerType(type: string, color: string): void;
    prefix(prefix: string): {
      warn: (message: string) => void;
      error: (message: string) => void;
    };
  }
}

declare module './vendor/pulse.min.mjs' {
  export const Pulse: {
    on: (target: any, event: string, callback: Function) => void;
  };
}

declare module './vendor/tween.min.mjs' {
  export class Tween {
    static easeInOutQuad: any;
    stop(): void;
    build(options: any): {
      animate: (callback: (values: any) => void) => void;
    };
  }
}
