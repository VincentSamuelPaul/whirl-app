import { app, BrowserWindow, ipcMain, screen, clipboard, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let isCapturing = false;

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function createOverlayWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    
    overlayWindow = new BrowserWindow({
        width,
        height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    overlayWindow.setIgnoreMouseEvents(false);
    overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));
}

function captureScreenshot(bounds: { x: number; y: number; width: number; height: number }) {
    if (!overlayWindow) return;

    const { x, y, width, height } = bounds;
    const screenshotPath = path.join(os.tmpdir(), 'circle-search-screenshot.png');
    
    // Use screencapture command for macOS
    const command = `screencapture -R${x},${y},${width},${height} "${screenshotPath}"`;
    
    exec(command, (error) => {
        if (error) {
            console.error('Screenshot capture failed:', error);
            return;
        }

        // Read the screenshot file
        const image = nativeImage.createFromPath(screenshotPath);
        if (!image) {
            console.error('Failed to create image from screenshot');
            return;
        }

        // Copy to clipboard
        clipboard.writeImage(image);

        // Open Google Lens in Chrome
        const openChromeCommand = `open -a "Google Chrome" "https://lens.google.com"`;
        exec(openChromeCommand, (error) => {
            if (error) {
                console.error('Failed to open Chrome:', error);
                return;
            }

            // Wait for Chrome to open and paste the image
            setTimeout(() => {
                const pasteScript = `
                    tell application "Google Chrome"
                        activate
                        delay 1
                        tell application "System Events"
                            keystroke "v" using {command down}
                        end tell
                    end tell
                `;
                
                exec(`osascript -e '${pasteScript}'`, (error) => {
                    if (error) {
                        console.error('Failed to paste image:', error);
                    }
                });
            }, 2000);
        });

        // Clean up the screenshot file after a delay
        setTimeout(() => {
            try {
                fs.unlinkSync(screenshotPath);
            } catch (err) {
                console.error('Failed to delete screenshot:', err);
            }
        }, 5000);
    });
}

app.whenReady().then(() => {
    createMainWindow();
    createOverlayWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('start-capture', () => {
    isCapturing = true;
});

ipcMain.on('end-capture', (_event, bounds) => {
    if (!isCapturing) return;
    
    isCapturing = false;
    
    if (overlayWindow) {
        overlayWindow.hide();
    }
    
    captureScreenshot(bounds);
    
    // Close the overlay window after a short delay
    setTimeout(() => {
        if (overlayWindow) {
            overlayWindow.close();
            overlayWindow = null;
        }
    }, 100);
});

ipcMain.on('cancel-capture', () => {
    isCapturing = false;
    
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }
}); 