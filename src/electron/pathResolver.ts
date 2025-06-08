import * as path from 'path';
import { app } from "electron";
import { isDev } from "./util";

export const getPreloadPath = (): string => {
    if (isDev()) {
        return path.join(app.getAppPath(), 'dist-electron', 'preload.js');
    } else {
        // In production, the preload script is bundled with the main process
        return path.join(process.resourcesPath, 'app.asar', 'dist-electron', 'preload.js');
    }
};