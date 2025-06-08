/// <reference types="node" />

interface ElectronAPI {
    send: (channel: 'start-capture' | 'end-capture' | 'cancel-capture', data: Record<string, unknown>) => void;
    receive: (channel: 'start-capture' | 'end-capture' | 'cancel-capture', callback: (...args: unknown[]) => void) => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

declare module 'sharp' {
    interface Sharp {
        extract(region: { left: number; top: number; width: number; height: number }): Sharp;
        toBuffer(): Promise<Buffer>;
        toFile(path: string): Promise<void>;
        resize(width: number, height: number): Sharp;
    }
    
    function sharp(input: Buffer): Sharp;
    export = sharp;
} 