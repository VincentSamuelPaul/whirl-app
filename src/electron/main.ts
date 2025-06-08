import { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer, clipboard, nativeImage, screen as electronScreen, Tray, Menu } from "electron";
import * as path from 'path';
import { isDev } from "./util";
import { getPreloadPath } from "./pathResolver";
import sharp from 'sharp';
import { exec } from 'child_process';
import fs from 'fs';
import { dialog } from 'electron';

interface CaptureBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

let isCapturing = false;
let captureWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function cleanupCapture() {
    console.log('Starting cleanup process');
    if (captureWindow) {
        console.log('Closing capture window');
        captureWindow.close();
        captureWindow = null;
    }
    isCapturing = false;
    console.log('Cleanup completed');
}

async function captureScreenshot(bounds: CaptureBounds) {
    try {
        console.log('Starting screenshot capture with bounds:', JSON.stringify(bounds));
        
        // Validate selection size
        if (bounds.width < 10 || bounds.height < 10) {
            console.log('Selection too small, ignoring');
            return;
        }

        // Hide window before capture
        if (captureWindow) {
            console.log('Hiding capture window');
            captureWindow.hide();
        }

        console.log('Getting screen sources');
        const sources = await desktopCapturer.getSources({ 
            types: ['screen'],
            thumbnailSize: electronScreen.getPrimaryDisplay().workAreaSize
        });
        console.log('Got sources:', sources.length);

        // Get the screenshot
        const source = sources[0];
        console.log('Processing screenshot from source:', source.name);
        const image = await sharp(source.thumbnail.toPNG())
            .extract({
                left: Math.round(bounds.x),
                top: Math.round(bounds.y),
                width: Math.round(bounds.width),
                height: Math.round(bounds.height)
            })
            .toBuffer();
        console.log('Screenshot processed successfully');

        // Save the screenshot to a temporary directory
        const tempDir = path.join(app.getPath('temp'), 'circle-to-search');
        console.log('Using temp directory:', tempDir);
        
        if (!fs.existsSync(tempDir)) {
            console.log('Creating temp directory');
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = path.join(tempDir, `screenshot-${timestamp}.png`);
        console.log('Saving screenshot to:', screenshotPath);
        await sharp(image).toFile(screenshotPath);
        console.log('Screenshot saved successfully');

        // Upload to Google Lens
        console.log('Starting Google Lens upload process');
        await uploadToGoogleLens(screenshotPath);
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        dialog.showErrorBox(
            'Screenshot Error',
            `Failed to capture screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    } finally {
        cleanupCapture();
    }
}

app.on("ready", () => {
    // Set app icon
    const appIconPath = isDev()
        ? path.join(app.getAppPath(), 'assets/whirl.png')
        : path.join(process.resourcesPath, 'assets/whirl.png');
    const appIcon = nativeImage.createFromPath(appIconPath);
    app.dock?.setIcon(appIcon);

    // Hide app from dock
    if (process.platform === 'darwin' && app.dock) {
        app.dock.hide();
    }

    // Tray setup
    const iconPath = isDev()
        ? path.join(app.getAppPath(), 'assets/whirltray.png')
        : path.join(process.resourcesPath, 'assets/whirltray.png');
    
    tray = new Tray(iconPath);
    
    // Set icon size for macOS
    if (process.platform === 'darwin') {
        tray.setImage(iconPath);
    }
    
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'About Whirl',
            click: () => {
                dialog.showMessageBox({
                    type: 'info',
                    title: 'About',
                    message: 'Whirl\nA Circle-to-Search App\nVersion 1.0.0\nA simple macOS tool for Google Lens search.\nDeveloped by\nVincent Samuel Paul'
                });
            }
        },
        {
            label: 'Search',
            click: () => {
                if (isCapturing) {
                    cleanupCapture();
                } else {
                    // Trigger the capture process directly
                    isCapturing = true;
                    try {
                        // Get screen dimensions
                        const { width, height } = electronScreen.getPrimaryDisplay().workAreaSize;
                        
                        // Create a transparent window that covers the entire screen
                        captureWindow = new BrowserWindow({
                            width,
                            height,
                            transparent: true,
                            frame: false,
                            alwaysOnTop: true,
                            hasShadow: false,
                            skipTaskbar: true,
                            webPreferences: {
                                preload: getPreloadPath(),
                                nodeIntegration: false,
                                contextIsolation: true,
                                backgroundThrottling: false
                            }
                        });

                        // Set window properties
                        captureWindow.setBackgroundColor('#00000000');
                        captureWindow.setOpacity(1);
                        captureWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
                        captureWindow.setAlwaysOnTop(true, 'screen-saver');
                        captureWindow.setIgnoreMouseEvents(false);

                        // Load the overlay HTML
                        const overlayPath = isDev() 
                            ? path.join(app.getAppPath(), 'src/overlay.html')
                            : path.join(process.resourcesPath, 'overlay.html');
                        
                        captureWindow.loadFile(overlayPath);
                    } catch (error) {
                        console.error('Error in capture process:', error);
                        cleanupCapture();
                    }
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                // Cleanup before quitting
                cleanupCapture();
                if (tray) {
                    tray.destroy();
                }
                // Force quit the app
                app.exit(0);
            }
        }
    ]);
    
    tray.setToolTip('Circle-to-Search');
    tray.setContextMenu(contextMenu);

    // Register global shortcut (Cmd+Shift+C)
    const success = globalShortcut.register('CommandOrControl+Shift+C', async () => {
        console.log('Shortcut triggered');
        if (isCapturing) {
            cleanupCapture();
            return;
        }
        isCapturing = true;

        try {
            // Get screen dimensions
            const { width, height } = electronScreen.getPrimaryDisplay().workAreaSize;
            
            // Create a transparent window that covers the entire screen
            captureWindow = new BrowserWindow({
                width,
                height,
                transparent: true,
                frame: false,
                alwaysOnTop: true,
                hasShadow: false,
                skipTaskbar: true,
                webPreferences: {
                    preload: getPreloadPath(),
                    nodeIntegration: false,
                    contextIsolation: true,
                    backgroundThrottling: false
                }
            });

            // Set window properties
            captureWindow.setBackgroundColor('#00000000');
            captureWindow.setOpacity(1);
            captureWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
            captureWindow.setAlwaysOnTop(true, 'screen-saver');
            captureWindow.setIgnoreMouseEvents(false);

            // Load the overlay HTML
            const overlayPath = isDev() 
                ? path.join(app.getAppPath(), 'src/overlay.html')
                : path.join(process.resourcesPath, 'overlay.html');
            
            await captureWindow.loadFile(overlayPath);

            // Handle mouse events
            captureWindow.webContents.on('did-finish-load', () => {
                captureWindow?.webContents.executeJavaScript(`
                    const overlay = document.getElementById('overlay');
                    const selection = document.getElementById('selection');
                    let isDrawing = false;
                    let startX, startY;

                    overlay.addEventListener('mousedown', (e) => {
                        isDrawing = true;
                        startX = e.clientX;
                        startY = e.clientY;
                        selection.style.display = 'block';
                        selection.style.left = startX + 'px';
                        selection.style.top = startY + 'px';
                        selection.style.width = '0';
                        selection.style.height = '0';
                        window.electron.send('start-capture', { x: startX, y: startY });
                    });

                    overlay.addEventListener('mousemove', (e) => {
                        if (!isDrawing) return;
                        
                        const currentX = e.clientX;
                        const currentY = e.clientY;
                        
                        const width = Math.abs(currentX - startX);
                        const height = Math.abs(currentY - startY);
                        
                        selection.style.left = Math.min(startX, currentX) + 'px';
                        selection.style.top = Math.min(startY, currentY) + 'px';
                        selection.style.width = width + 'px';
                        selection.style.height = height + 'px';
                    });

                    overlay.addEventListener('mouseup', (e) => {
                        if (!isDrawing) return;
                        isDrawing = false;
                        window.electron.send('end-capture', { x: e.clientX, y: e.clientY });
                    });

                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'Escape') {
                            window.electron.send('cancel-capture');
                        }
                    });
                `);
            });

            // Handle IPC messages
            ipcMain.on('start-capture', () => {
                console.log('Start capture event received');
            });

            ipcMain.on('end-capture', (_event, bounds) => {
                console.log('End capture event received with bounds:', bounds);
                captureScreenshot(bounds);
            });

            ipcMain.on('cancel-capture', () => {
                console.log('Cancel capture event received');
                cleanupCapture();
            });

        } catch (error) {
            console.error('Error in capture process:', error);
            cleanupCapture();
        }
    });

    if (!success) {
        console.error('Failed to register shortcut');
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // No need to create main window on activate
});

async function uploadToGoogleLens(imagePath: string) {
    try {
        console.log('Starting Google Lens upload for:', imagePath);
        
        // Verify file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found at path: ${imagePath}`);
        }
        console.log('Image file exists at path');

        // Read the image file and convert to native image
        console.log('Reading image file');
        const image = nativeImage.createFromPath(imagePath);
        if (!image) {
            throw new Error('Failed to create native image from path');
        }
        console.log('Image loaded successfully');

        // Set the image to clipboard
        console.log('Copying image to clipboard');
        clipboard.writeImage(image);
        console.log('Image copied to clipboard');

        // Open Google Lens
        console.log('Opening Google Lens in Chrome');
        const command = `open -a "Google Chrome" "https://lens.google.com"`;
        exec(command, async (error) => {
            if (error) {
                console.error('Error opening Chrome:', error);
                throw error;
            }
            console.log('Chrome opened successfully');

            // Wait a moment for Chrome to open
            console.log('Waiting for Chrome to open (3 seconds)');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Use AppleScript to paste the image
            const pasteScript = `
                tell application "Google Chrome"
                    activate
                    delay 2
                    tell application "System Events"
                        keystroke "v" using {command down}
                        delay 1
                    end tell
                end tell
            `;
            
            console.log('Executing AppleScript to paste image');
            exec(`osascript -e '${pasteScript}'`, (pasteError) => {
                if (pasteError) {
                    console.error('Error pasting image:', pasteError);
                    dialog.showErrorBox(
                        'Paste Error',
                        `Failed to paste image: ${pasteError.message}`
                    );
                } else {
                    console.log('Image pasted successfully');
                }
            });
        });
    } catch (error: unknown) {
        console.error('Error uploading to Google Lens:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        dialog.showErrorBox(
            'Upload Error',
            `Failed to upload to Google Lens: ${errorMessage}\n\nPlease try again.`
        );
    }
}