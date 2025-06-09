#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Whirl build process...${NC}"
echo -e "${YELLOW}Building in current directory: $(pwd)${NC}"

# Function to install Homebrew if not present
install_homebrew() {
    if ! command -v brew &> /dev/null; then
        echo -e "${YELLOW}Installing Homebrew...${NC}"
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to install Homebrew${NC}"
            exit 1
        fi
        # Add Homebrew to PATH if it's not already there
        if [[ ":$PATH:" != *":/opt/homebrew/bin:"* ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    fi
}

# Function to install Node.js and npm
install_node() {
    echo -e "${YELLOW}Installing Node.js and npm...${NC}"
    # Download and install Node.js using the official installer
    NODE_VERSION="20.11.1" # LTS version
    NODE_DISTRO="darwin-arm64" # For Apple Silicon Macs
    
    # Check if we're on Intel Mac
    if [[ $(uname -m) == "x86_64" ]]; then
        NODE_DISTRO="darwin-x64"
    fi
    
    NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${NODE_DISTRO}.pkg"
    TEMP_PKG="/tmp/node-installer.pkg"
    
    echo -e "${YELLOW}Downloading Node.js installer...${NC}"
    curl -L "${NODE_URL}" -o "${TEMP_PKG}"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to download Node.js installer${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Installing Node.js...${NC}"
    sudo installer -pkg "${TEMP_PKG}" -target /
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install Node.js${NC}"
        rm "${TEMP_PKG}"
        exit 1
    fi
    
    rm "${TEMP_PKG}"
    
    # Verify installation
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        echo -e "${RED}Error: Node.js installation completed but node/npm commands not found${NC}"
        echo -e "${YELLOW}Please try restarting your terminal and running the script again${NC}"
        exit 1
    fi
}

# Check if we're already in the repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}Already in Whirl repository, skipping clone...${NC}"
else
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        echo -e "${YELLOW}Git not found. Installing git...${NC}"
        install_homebrew
        brew install git
        if [ $? -ne 0 ]; then
            echo -e "${RED}Error: Failed to install git${NC}"
            exit 1
        fi
    fi

    # Clone the repository directly in current directory
    echo -e "${YELLOW}Cloning Whirl repository...${NC}"
    git clone https://github.com/VincentSamuelPaul/whirl-app.git .
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to clone repository${NC}"
        exit 1
    fi
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

# Build the app
echo -e "${YELLOW}Building Whirl (optimized build)...${NC}"
# Build React app and Electron main process with optimized settings
npm run dist:mac
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build the app${NC}"
    exit 1
fi

# Verify the app was built
if [ -d "dist/mac-arm64/Whirl.app" ]; then
    echo -e "${GREEN}Successfully built Whirl.app${NC}"
    echo -e "${YELLOW}App size: $(du -sh dist/mac-arm64/Whirl.app | cut -f1)${NC}"
    ls -la "dist/mac-arm64/Whirl.app"
else
    echo -e "${RED}Error: Whirl.app not found in dist/mac-arm64/Whirl.app${NC}"
    echo -e "${YELLOW}Checking alternative locations...${NC}"
    find "dist" -name "Whirl.app" -type d
    echo -e "${YELLOW}Current directory contents:${NC}"
    ls -la
    exit 1
fi

echo -e "${GREEN}Whirl has been successfully built!${NC}"
echo -e "${YELLOW}The app is located at: $(pwd)/dist/mac-arm64/Whirl.app${NC}"
echo -e "${YELLOW}Build artifacts:${NC}"
echo -e "  - App: $(du -sh dist/mac-arm64/Whirl.app | cut -f1)"
echo -e "  - DMG: $(ls -lh dist/*.dmg 2>/dev/null | awk '{print $5}' || echo 'Not found')"
echo -e "  - ZIP: $(ls -lh dist/*.zip 2>/dev/null | awk '{print $5}' || echo 'Not found')"
echo -e "${YELLOW}Note: Since this is an unsigned app, you'll need to:${NC}"
echo -e "1. Right-click Whirl.app and select 'Open'"
echo -e "2. Click 'Open' in the security dialog"
echo -e "\n${GREEN}Enjoy using Whirl!${NC}" 