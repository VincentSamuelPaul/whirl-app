# Whirl – macOS Circle to Search App 🖥️🔍

**Whirl** is a lightweight, privacy-conscious **macOS desktop app** that lets you **draw a region on your screen and instantly search it using Google Lens** — just like “Circle to Search” on Android, but built for Mac.

This project is built using **Electron.js** and designed to enhance desktop productivity through fast, visual search.

---

## 🚀 Features

- ✏️ Draw any region on your screen  
- 🔍 Instantly search the selection using Google Lens  
- ⚡ Lightweight and runs in the background  
- ⌨️ Hotkey: `Cmd + Shift + C` to trigger the drawing tool  

---

## 🧠 How It Works

1. Captures the screen using Electron's `desktopCapturer`.  
2. Enables a drawing interface to select any screen region.  
3. Converts the selected region into an image.  
4. Opens Google Lens with the screenshot for instant visual search.  

---

## 🛠️ Tech Stack

- **Electron.js** – Cross-platform desktop application framework  
- **Node.js** – Backend scripting  
- **JavaScript** – Application logic and drawing overlay  
- **macOS Automation** – Hotkey bindings and permissions  

---

## 💻 Installation (macOS Only)

1. **Download the installer script:**  
   [Download build-whirl.sh](https://github.com/VincentSamuelPaul/whirl-app/releases/download/v1.0.0/build-whirl.sh)

2. **Open Terminal and run the installer:**

   ```bash
   bash build-whirl.sh
   ```

---

## 🧪 Usage

After installation is complete:

1. Open **Terminal**.  
2. Navigate to the folder where `build-whirl.sh` is located (if not already there).  
3. Run the script again (only if not already executed):

   ```bash
   bash build-whirl.sh
   ```
4. Once installed open the app and then

5. Use the hotkey:

   ```
   Command + Shift + C
   ```

This activates the drawing tool. You can now:

- ✅ Draw a rectangular region on your screen  
- ✅ Whirl will take a screenshot of the selected region  
- ✅ It will automatically open **Google Lens** in your default browser with results for the selected area  

---

## 📌 Requirements

- macOS 11 or above  
- Node.js (v14+ recommended)  
- Permissions: screen recording and accessibility access  

---

## 📈 What I Learned

- Working with **Electron APIs** to control and draw over the screen  
- Handling **macOS-specific permissions** and automation  
- Capturing screenshots in a secure, efficient way  
- Building user-friendly keyboard shortcuts for seamless UX  
- Optimizing app performance for a lightweight footprint  
- Logging user activity and managing analytics  
- Building and shipping a desktop-ready Electron app  
- Creating a smooth installation experience using bash scripting  

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!  
Feel free to open an issue or submit a pull request.

---

## 📄 License

[MIT License](LICENSE)
