#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Whirl build process...${NC}"

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

# Check and install git if needed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}Git not found. Installing git...${NC}"
    install_homebrew
    brew install git
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Failed to install git${NC}"
        exit 1
    fi
fi

# Check and install Node.js/npm if needed
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}Node.js/npm not found. Installing...${NC}"
    install_node
fi

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}Created temporary directory: ${TEMP_DIR}${NC}"

# Clone the repository
echo -e "${YELLOW}Cloning Whirl repository...${NC}"
git clone https://github.com/VincentSamuelPaul/whirl-frontend.git "${TEMP_DIR}/whirl"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to clone repository${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Navigate to the app directory
cd "${TEMP_DIR}/whirl/app"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Build the app
echo -e "${YELLOW}Building Whirl...${NC}"
npm run dist:mac
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to build the app${NC}"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Move the built app to Applications
echo -e "${YELLOW}Moving Whirl to Applications folder...${NC}"
if [ -d "/Applications/Whirl.app" ]; then
    echo -e "${YELLOW}Removing existing Whirl installation...${NC}"
    rm -rf "/Applications/Whirl.app"
fi

# Copy the new app
cp -R "${TEMP_DIR}/whirl/app/dist/mac-arm64/Whirl.app" "/Applications/"
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to move app to Applications folder${NC}"
    echo -e "${YELLOW}You can find the app at: ${TEMP_DIR}/whirl/app/dist/mac-arm64/Whirl.app${NC}"
    exit 1
fi

# Clean up
echo -e "${YELLOW}Cleaning up...${NC}"
rm -rf "${TEMP_DIR}"

echo -e "${GREEN}Whirl has been successfully built and installed!${NC}"
echo -e "${YELLOW}Note: Since this is an unsigned app, you'll need to:${NC}"
echo -e "1. Open System Preferences > Security & Privacy"
echo -e "2. Click 'Open Anyway' for Whirl"
echo -e "3. Or right-click Whirl.app and select 'Open'"
echo -e "\n${GREEN}Enjoy using Whirl!${NC}" 