import { contextBridge, ipcRenderer } from 'electron';

type Channel = 'start-capture' | 'end-capture' | 'cancel-capture' | 'search-with-text';
type Data = Record<string, unknown>;

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'electron',
    {
        send: (channel: Channel, data: Data) => {
            // whitelist channels
            const validChannels: Channel[] = ['start-capture', 'end-capture', 'cancel-capture', 'search-with-text'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel: Channel, callback: (...args: unknown[]) => void) => {
            const validChannels: Channel[] = ['start-capture', 'end-capture', 'cancel-capture', 'search-with-text'];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (_event, ...args) => callback(...args));
            }
        }
    }
); 