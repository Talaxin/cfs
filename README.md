# PROXMARK3 for CFS

A web-based tool for generating PROXMARK3 commands to write RFID tags that work with the Creality K2 Plus and CFS (Creality Filament System).

## Features

- **Direct PROXMARK3 Integration** - Connect to your PROXMARK3 device via Web Serial API
- **One-Click Tag Operations**:
  - Read tag and auto-fill UID
  - Write tag data directly to RFID tags
- Generate PROXMARK3 commands for **encrypted RFID tags only** with Creality Tag Encryption
- Support for all standard Creality material codes (70+ materials)
- Auto-fill today's date with one click
- Dropdown for common filament lengths
- Random serial number generator
- Clean, modern web interface
- Copy commands directly to clipboard
- Real-time device log for debugging

## Usage

1. Open `index.html` in a web browser
2. Fill in the form fields:
   - **Batch** (3 characters)
   - **Date** (5 characters, YYMDD format) - Click "Today" button to auto-fill
   - **Supplier** (4 characters)
   - **Material** (5 characters) - Use the "View Default Materials" button for a list
   - **Color** (7 characters, prefix is 0, not #)
   - **Length** (4 characters) - Select from dropdown (500g, 1kg, 2kg, etc.)
   - **Serial** (6 characters) - Click "Random" to generate a random serial number
   - **Reserve** (14 characters, not used yet)
3. **Tag Encryption (Required):**
   - Enter the 8-digit hexadecimal Tag UID (required)
   - Select whether the tag is already encrypted or not
4. Click "Generate Commands" to create the PROXMARK3 commands
5. Copy the generated commands and use them with your PROXMARK3 device

## Warning

⚠️ **No safeguards are implemented** - be careful with the data you enter. There are NO data validation checks!

## Requirements

- A web browser with Web Serial API support:
  - **Chrome/Chromium** (recommended)
  - **Edge** (recommended)
  - **Opera**
  - Note: Firefox and Safari do not support Web Serial API
- PROXMARK3 device with [Iceman fork firmware](https://github.com/RfidResearchGroup/proxmark3) installed
- USB connection to PROXMARK3 device
- Basic knowledge of PROXMARK3 usage

## PROXMARK3 Connection

The tool supports direct connection to your PROXMARK3 device:

1. **Connect**: Click "Connect to PROXMARK3" and select your device from the browser's port selection dialog
2. **Read Tag**: Place a MIFARE Classic 1K tag on the PROXMARK3 and click "Read Tag & Auto-fill UID" to automatically extract and fill the UID
3. **Write Tag**: After filling in all form fields, click "Write Tag" to write the data directly to the tag

The device log shows all commands and responses for debugging purposes.

## Tag Specifications

- **Tag Type**: MIFARE Classic 1K
- **Memory**: 1KB (1024 bytes)
- **Structure**: 16 sectors × 4 blocks = 64 blocks total
- **Data Location**: Sector 0, Blocks 0-2 (48 bytes total)
- **Block 0**: Contains UID and manufacturer data (first 4 bytes are UID)
- **Important**: Ensure your tag allows writing to block 0. Some tags have locked UIDs and block 0 cannot be written.

## Files

- `index.html` - Main HTML file
- `style.css` - Styling
- `script.js` - JavaScript logic for command generation

## License

This project replicates the functionality of https://deusrex2k.github.io/proxmark4cfs.html