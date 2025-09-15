// Global declarations for VYLO engine
declare global {
  const VYLO: {
    Client: {
      addInterfaceElement: (element: any, interfaceHandle: string, id: string) => void;
      checkInterfaceShown: (interfaceHandle: string) => boolean;
      showInterface: (interfaceHandle: string) => void;
      createInterface: (interfaceHandle: string) => void;
      getScreenScale: () => { x: number; y: number };
      getPosFromScreen: (x: number, y: number, mapPositionObject?: any) => { x: number; y: number };
      mob: {
        mapName: string;
      } | null;
      getInterfaceElementsFromScreen: (x: number, y: number, ...args: any[]) => any[];
      onTouchBegin: ((touchedInstance: any, x: number, y: number, fingerID: number) => void) | undefined;
      onTouchFinish: ((touchedInstance: any, x: number, y: number, fingerID: number) => void) | undefined;
      onTouchAbort: (() => void) | undefined;
      onTouchMoveUpdate: ((touchedInstance: any, x: number, y: number, fingerID: number) => void) | undefined;
    };
    World: {
      getGameSize: () => { width: number; height: number };
    };
    Map: {
      getDiobsByPos: (mapName: string, x: number, y: number) => any[];
    };
    newDiob: (type: string) => any;
  };

  const mainM: {
    scaleWidth: number;
    scaleHeight: number;
  };
}

export {};
