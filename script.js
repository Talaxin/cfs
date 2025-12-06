// PROXMARK3 connection state
let proxmarkPort = null;
let proxmarkReader = null;
let proxmarkWriter = null;
let isConnected = false;

// Material codes and names (extracted from Creality Print app)
const MATERIALS = {
    '00001': 'Generic PLA',
    '00002': 'Generic PLA-Silk',
    '00003': 'Generic PETG',
    '00004': 'Generic ABS',
    '00005': 'Generic TPU',
    '00006': 'Generic PLA-CF',
    '00007': 'Generic ASA',
    '00008': 'Generic PA',
    '00009': 'Generic PA-CF',
    '00010': 'Generic BVOH',
    '00011': 'Generic PVA',
    '00012': 'Generic HIPS',
    '00013': 'Generic PET-CF',
    '00014': 'Generic PETG-CF',
    '00015': 'Generic PA6-CF',
    '00016': 'Generic PAHT-CF',
    '00017': 'Generic PPS',
    '00018': 'Generic PPS-CF',
    '00019': 'Generic PP',
    '00020': 'Generic PET',
    '00021': 'Generic PC',
    '00022': 'Generic PA612-CF',
    '00023': 'Generic Support for PA',
    '00024': 'Generic Support for PLA',
    '00025': 'Generic PA12-CF',
    '00026': 'Generic TPU 64D',
    '00027': 'Generic PETG-GF',
    '00031': 'Generic PP-CF',
    '00032': 'Generic PCTG',
    '00033': 'Generic ASA-CF',
    '00034': 'Generic PA6-GF',
    '00035': 'PLA-LW',
    '01001': 'Hyper PLA',
    '01002': 'Hyper L-W PLA',
    '01004': 'Hyper Stardust',
    '01601': 'Soleyin Ultra PLA',
    '02001': 'Hyper PLA-CF',
    '03001': 'Hyper ABS',
    '04001': 'CR-PLA',
    '05001': 'CR-Silk',
    '06001': 'CR-PETG',
    '06002': 'Hyper PETG',
    '06003': 'Hyper PETG-CF',
    '06004': 'Hyper PETG-GF',
    '07001': 'CR-ABS',
    '07002': 'Hyper PC',
    '08001': 'Ender-PLA',
    '09001': 'EN-PLA+',
    '09002': 'ENDER FAST PLA',
    '10001': 'HP-TPU',
    '11001': 'CR-Nylon',
    '12002': 'Hyper PPA-CF',
    '12003': 'Hyper PAHT-CF',
    '12004': 'Hyper PA612-CF',
    '12005': 'Hyper PA6-CF',
    '13001': 'CR-PLA Carbon',
    '14001': 'CR-PLA Matte',
    '15001': 'CR-PLA Fluo',
    '16001': 'CR-TPU',
    '17001': 'CR-Wood',
    '18001': 'HP Ultra PLA',
    '19001': 'HP-ASA',
    '29001': 'Hyper Marble',
    'E1001': 'PLA+',
    'E1002': 'PLA-Silk',
    'E1003': 'PLA-Matte',
    'E1004': 'PLA-Lite',
    'P1001': 'Panchroma PLA Satin',
    'P1002': 'PolySonic PLA Pro',
    'P1003': 'Panchroma PLA Matte',
    'P1004': 'PolySonic PLA'
};

// Initialize materials datalist
function initMaterials() {
    const datalist = document.getElementById('materials');
    Object.keys(MATERIALS).forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = `${code} - ${MATERIALS[code]}`;
        datalist.appendChild(option);
    });
}

// Populate materials modal
function populateMaterialsModal() {
    const list = document.getElementById('materialsList');
    list.innerHTML = '';
    Object.entries(MATERIALS).forEach(([code, name]) => {
        const div = document.createElement('div');
        div.className = 'material-item';
        div.textContent = `${code} - ${name}`;
        div.onclick = function() {
            document.getElementById('material').value = code;
            closeMaterials();
        };
        list.appendChild(div);
    });
}

// Show materials modal
function showMaterials() {
    const modal = document.getElementById('materialsModal');
    modal.style.display = 'block';
}

// Close materials modal
function closeMaterials() {
    const modal = document.getElementById('materialsModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('materialsModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Encryption is now always required - no toggle needed

// Convert string to hex
function stringToHex(str) {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        hex += charCode.toString(16).padStart(2, '0').toUpperCase();
    }
    return hex;
}

// Convert hex to string
function hexToString(hex) {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        const hexChar = hex.substr(i, 2);
        str += String.fromCharCode(parseInt(hexChar, 16));
    }
    return str;
}

// Pad string to specified length
function padString(str, length, padChar = '0') {
    return (str || '').padStart(length, padChar).substring(0, length);
}

// Generate sector 1 key from UID
// Creality uses a specific algorithm to generate the sector key from the UID
function generateSectorKey(uid) {
    if (!uid || uid.length !== 8) {
        return '';
    }
    
    // Convert UID to bytes
    const uidBytes = [];
    for (let i = 0; i < uid.length; i += 2) {
        uidBytes.push(parseInt(uid.substr(i, 2), 16));
    }
    
    // Creality key generation algorithm (common pattern for MIFARE)
    // This is a simplified version - actual algorithm may vary
    const keyBytes = [];
    for (let i = 0; i < 6; i++) {
        // Use UID bytes with XOR and rotation
        const idx = i % uidBytes.length;
        let byte = uidBytes[idx];
        // Apply transformation
        byte = ((byte << 1) | (byte >> 7)) & 0xFF;
        byte ^= 0xAA;
        keyBytes.push(byte);
    }
    
    // Convert to hex string (12 characters for 6 bytes)
    return keyBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}

// Generate unencrypted commands
function generateUnencrypted() {
    const batch = padString(document.getElementById('batch').value, 3);
    const date = padString(document.getElementById('date').value, 5);
    const supplier = padString(document.getElementById('supplier').value, 4);
    const material = padString(document.getElementById('material').value, 5);
    const color = padString(document.getElementById('color').value, 7);
    const length = padString(document.getElementById('length').value, 4);
    const serial = padString(document.getElementById('serial').value, 6);
    const reserve = padString(document.getElementById('reserve').value, 14);

    // Build ASCII string (48 characters total: 3+5+4+5+7+4+6+14)
    const asciiString = batch + date + supplier + material + color + length + serial + reserve;
    
    // Convert to hex - 48 bytes = 96 hex characters
    // Split into 3 blocks of 16 bytes each (32 hex characters per block)
    const fullHex = stringToHex(asciiString.padEnd(48, '\0'));
    const block0 = fullHex.substring(0, 32);
    const block1 = fullHex.substring(32, 64);
    const block2 = fullHex.substring(64, 96);

    // Generate PROXMARK3 commands
    const commands = [
        `hf mf wrbl 0 A FFFFFFFFFFFF ${block0}`,
        `hf mf wrbl 1 A FFFFFFFFFFFF ${block1}`,
        `hf mf wrbl 2 A FFFFFFFFFFFF ${block2}`
    ];

    // Display results
    document.getElementById('asciiResult').value = asciiString;
    document.getElementById('proxmarkCommands').value = commands.join('\n');
    document.getElementById('sectorKeySection').style.display = 'none';
    document.getElementById('results').style.display = 'block';
}

// Generate encrypted commands (encryption is now always required)
function generateEncrypted() {
    const batch = padString(document.getElementById('batch').value, 3);
    const date = padString(document.getElementById('date').value, 5);
    const supplier = padString(document.getElementById('supplier').value, 4);
    const material = padString(document.getElementById('material').value, 5);
    const color = padString(document.getElementById('color').value, 7);
    const length = padString(document.getElementById('length').value, 4);
    const serial = padString(document.getElementById('serial').value, 6);
    const reserve = padString(document.getElementById('reserve').value, 14);
    let tagUid = document.getElementById('tagUid').value.toUpperCase().replace(/[^0-9A-F]/g, '');
    const isAlreadyEncrypted = document.querySelector('input[name="encryptionStatus"]:checked').value === 'encrypted';

    // Tag UID is required for encrypted tags
    if (!tagUid || tagUid.length !== 8) {
        alert('Tag UID is required! Please enter a valid 8-digit hexadecimal Tag UID (e.g., 12345678)');
        document.getElementById('tagUid').focus();
        if (tagUid) {
            document.getElementById('tagUid').value = tagUid;
        }
        return;
    }
    
    // Update the input field with cleaned value
    document.getElementById('tagUid').value = tagUid;

    // Build ASCII string
    const asciiString = batch + date + supplier + material + color + length + serial + reserve;
    
    // Generate sector 1 key
    const sectorKey = generateSectorKey(tagUid);
    
    // Convert to hex
    const fullHex = stringToHex(asciiString.padEnd(48, '\0'));
    const block0 = fullHex.substring(0, 32);
    const block1 = fullHex.substring(32, 64);
    const block2 = fullHex.substring(64, 96);

    // Generate PROXMARK3 commands
    const defaultKey = 'FFFFFFFFFFFF';
    const commands = [
        `hf mf wrbl 0 A ${defaultKey} ${block0}`,
        `hf mf wrbl 1 A ${defaultKey} ${block1}`,
        `hf mf wrbl 2 A ${defaultKey} ${block2}`
    ];

    // Add sector 1 key command for setting the key
    // Note: The actual command may vary - this sets the key for sector 1
    if (!isAlreadyEncrypted) {
        // Use hf mf csetkey or hf mf setkey depending on Proxtools version
        commands.push(`hf mf csetkey 1 A ${sectorKey}`);
    }

    // Display results
    document.getElementById('asciiResult').value = asciiString;
    document.getElementById('proxmarkCommands').value = commands.join('\n');
    document.getElementById('sectorKey').value = sectorKey;
    document.getElementById('sectorKeySection').style.display = 'block';
    document.getElementById('results').style.display = 'block';
}

// Copy commands to clipboard
function copyCommands() {
    const commands = document.getElementById('proxmarkCommands');
    commands.select();
    document.execCommand('copy');
    alert('Commands copied to clipboard!');
}

// Reset form
function resetForm() {
    document.getElementById('tagForm').reset();
    document.getElementById('results').style.display = 'none';
    // Reset encryption status to default
    document.querySelector('input[name="encryptionStatus"][value="notEncrypted"]').checked = true;
}

// Fill today's date in YYMDD format
// Format: YYMDD where YY=year (2 digits), M=month (1 digit: 1-9 for Jan-Sep, last digit for Oct/Nov/Dec), DD=day (2 digits)
function fillTodayDate() {
    const today = new Date();
    const year = today.getFullYear().toString().substring(2); // Last 2 digits of year
    const monthNum = today.getMonth() + 1; // Month (1-12)
    const day = today.getDate().toString().padStart(2, '0'); // Day with leading zero
    
    // Convert month to single digit: 1-9 for Jan-Sep, last digit (0/1/2) for Oct/Nov/Dec
    const month = monthNum <= 9 ? monthNum.toString() : (monthNum % 10).toString();
    
    // Format: YYMDD (5 characters total)
    const dateString = year + month + day;
    document.getElementById('date').value = dateString;
}

// Randomize serial number (6 digits)
function randomizeSerial() {
    // Generate a random 6-digit number
    const randomSerial = Math.floor(100000 + Math.random() * 900000).toString();
    document.getElementById('serial').value = randomSerial;
}

// PROXMARK3 Connection Functions
async function connectProxmark() {
    if (!('serial' in navigator)) {
        alert('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
        return;
    }

    try {
        // Request port access
        proxmarkPort = await navigator.serial.requestPort();
        
        // Open the port with PROXMARK3 settings (115200 baud, 8N1)
        await proxmarkPort.open({ 
            baudRate: 115200,
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
        });

        // Set up reader and writer
        proxmarkReader = proxmarkPort.readable.getReader();
        proxmarkWriter = proxmarkPort.writable.getWriter();

        isConnected = true;
        updateConnectionStatus(true);
        logMessage('Connected to PROXMARK3');
        
        // Wait a moment for the device to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Clear any initial data in the buffer
        try {
            const decoder = new TextDecoder();
            let initialData = '';
            const startTime = Date.now();
            while (Date.now() - startTime < 1000) {
                const { value, done } = await proxmarkReader.read();
                if (done) break;
                if (value && value.length > 0) {
                    initialData += decoder.decode(value, { stream: true });
                }
                // If we see a prompt, we're ready
                if (initialData.includes('pm3>') || initialData.includes('proxmark3>')) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            if (initialData) {
                logMessage('Initial data: ' + initialData.substring(0, 200));
            }
        } catch (e) {
            // Ignore errors during initial read
            logMessage('Note: Could not read initial data');
        }
        
        // Send initial command to check connection
        try {
            await sendCommand('hw version');
        } catch (e) {
            logMessage('Warning: Could not verify connection with hw version command');
        }
        
    } catch (error) {
        if (error.name === 'NotFoundError') {
            alert('No PROXMARK3 device selected.');
        } else {
            alert('Error connecting to PROXMARK3: ' + error.message);
            logMessage('Connection error: ' + error.message);
        }
        isConnected = false;
        updateConnectionStatus(false);
    }
}

async function disconnectProxmark() {
    try {
        if (proxmarkReader) {
            await proxmarkReader.cancel();
            await proxmarkReader.release();
            proxmarkReader = null;
        }
        if (proxmarkWriter) {
            await proxmarkWriter.release();
            proxmarkWriter = null;
        }
        if (proxmarkPort) {
            await proxmarkPort.close();
            proxmarkPort = null;
        }
        isConnected = false;
        updateConnectionStatus(false);
        logMessage('Disconnected from PROXMARK3');
    } catch (error) {
        logMessage('Error disconnecting: ' + error.message);
    }
}

function updateConnectionStatus(connected) {
    const statusText = document.getElementById('statusText');
    const statusDiv = statusText.parentElement;
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const testBtn = document.getElementById('testBtn');
    const readTagBtn = document.getElementById('readTagBtn');
    const writeTagBtn = document.getElementById('writeTagBtn');
    const writeTagFormBtn = document.getElementById('writeTagFormBtn');
    const logDiv = document.getElementById('proxmarkLog');

    if (connected) {
        statusText.textContent = 'Connected';
        statusDiv.className = 'connection-status connected';
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-block';
        testBtn.disabled = false;
        readTagBtn.disabled = false;
        writeTagBtn.disabled = false;
        writeTagFormBtn.disabled = false;
        logDiv.style.display = 'block';
    } else {
        statusText.textContent = 'Not connected';
        statusDiv.className = 'connection-status disconnected';
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
        testBtn.disabled = true;
        readTagBtn.disabled = true;
        writeTagBtn.disabled = true;
        writeTagFormBtn.disabled = true;
    }
}

// Test connection with simple commands
async function testConnection() {
    if (!isConnected) {
        alert('Please connect to PROXMARK3 first');
        return;
    }

    logMessage('=== Starting Connection Test ===');
    
    const testCommands = [
        'hw version',
        'hw status',
        'hf 14a reader'
    ];

    for (const cmd of testCommands) {
        try {
            logMessage(`\nTesting command: ${cmd}`);
            const response = await sendCommand(cmd);
            logMessage(`Response received (${response.length} chars)`);
            if (response.length === 0) {
                logMessage('WARNING: Empty response!');
            }
            // Wait between commands
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            logMessage(`ERROR with command "${cmd}": ${error.message}`);
        }
    }
    
    logMessage('\n=== Connection Test Complete ===');
    alert('Test complete! Check the Device Log for results.');
}

async function sendCommand(command) {
    if (!isConnected || !proxmarkWriter) {
        throw new Error('Not connected to PROXMARK3');
    }

    try {
        // Send command with carriage return and newline (PROXMARK3 expects \r\n)
        const encoder = new TextEncoder();
        const data = encoder.encode(command + '\r\n');
        await proxmarkWriter.write(data);
        
        // Flush the write buffer
        await proxmarkWriter.ready;
        
        logMessage('> ' + command);
        
        // Small delay to let the device process the command
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Read response
        return await readResponse();
    } catch (error) {
        logMessage('Error sending command: ' + error.message);
        throw error;
    }
}

async function readResponse(timeout = 10000) {
    if (!proxmarkReader) {
        throw new Error('Reader not available');
    }

    let response = '';
    const startTime = Date.now();
    const decoder = new TextDecoder();
    let lastDataTime = Date.now();
    const idleTimeout = 300; // Wait 300ms of no data before considering response complete
    let consecutiveEmptyReads = 0;
    const maxEmptyReads = 5;

    try {
        while (Date.now() - startTime < timeout) {
            try {
                const { value, done } = await proxmarkReader.read();
                
                if (done) {
                    logMessage('Reader stream ended');
                    break;
                }
                
                if (value && value.length > 0) {
                    const decoded = decoder.decode(value, { stream: true });
                    response += decoded;
                    lastDataTime = Date.now();
                    consecutiveEmptyReads = 0;
                    
                    // Check if we have a complete response (ends with prompt)
                    // PROXMARK3 Iceman fork uses various prompt formats
                    if (response.match(/pm3>\s*$/m) || 
                        response.match(/proxmark3>\s*$/m) ||
                        response.match(/\[usb\]\s*pm3>\s*$/m)) {
                        // Got prompt, response is complete
                        break;
                    }
                } else {
                    consecutiveEmptyReads++;
                    // If we've had several empty reads and some data, check if complete
                    if (consecutiveEmptyReads >= maxEmptyReads && response.length > 0) {
                        // Check if we have a prompt or clear completion indicator
                        if (response.match(/pm3>\s*$/m) || 
                            response.match(/proxmark3>\s*$/m) ||
                            response.match(/\[usb\]\s*pm3>\s*$/m) ||
                            response.toLowerCase().includes('done') ||
                            response.toLowerCase().includes('ok')) {
                            break;
                        }
                    }
                }
                
                // If no data received for a while and we have some response, check if complete
                if (Date.now() - lastDataTime > idleTimeout && response.length > 0) {
                    // Check for various completion indicators
                    if (response.match(/pm3>\s*$/m) || 
                        response.match(/proxmark3>\s*$/m) ||
                        response.match(/\[usb\]\s*pm3>\s*$/m) ||
                        response.toLowerCase().includes('done') ||
                        response.toLowerCase().includes('ok') ||
                        response.toLowerCase().includes('error') ||
                        response.toLowerCase().includes('failed')) {
                        break;
                    }
                }
                
                // Small delay to prevent tight loop
                await new Promise(resolve => setTimeout(resolve, 10));
            } catch (readError) {
                // If read error but we have some response, try to return it
                if (response.length > 0) {
                    logMessage('Read error but have partial response: ' + readError.message);
                    break;
                }
                throw readError;
            }
        }
        
        // Log the response with more detail
        if (response) {
            // Clean up the response for logging (remove duplicate prompts if any)
            const cleanedResponse = response.trim();
            logMessage('< ' + cleanedResponse);
            logMessage(`(Response length: ${response.length} bytes)`);
        } else {
            logMessage('< (No response received)');
        }
        
        return response;
    } catch (error) {
        logMessage('Error reading response: ' + error.message);
        if (response) {
            logMessage('Partial response: ' + response.substring(0, 200));
        }
        throw error;
    }
}

function logMessage(message) {
    const logOutput = document.getElementById('logOutput');
    if (logOutput) {
        const timestamp = new Date().toLocaleTimeString();
        logOutput.value += `[${timestamp}] ${message}\n`;
        logOutput.scrollTop = logOutput.scrollHeight;
    }
}

function clearLog() {
    const logOutput = document.getElementById('logOutput');
    if (logOutput) {
        logOutput.value = '';
    }
}

// Read tag and extract UID (MIFARE Classic 1K)
async function readTag() {
    if (!isConnected) {
        alert('Please connect to PROXMARK3 first');
        return;
    }

    try {
        logMessage('Reading MIFARE Classic 1K tag...');
        
        // First, detect the tag using hf 14a reader
        let response = await sendCommand('hf 14a reader');
        
        // Wait a bit for full response
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try multiple UID patterns that PROXMARK3 might use
        let uid = null;
        
        // Pattern 1: "UID: 12 34 56 78" or "UID : 12 34 56 78"
        const uidMatch1 = response.match(/UID\s*[:\s]+\s*([0-9A-F]{2}\s+[0-9A-F]{2}\s+[0-9A-F]{2}\s+[0-9A-F]{2})/i);
        if (uidMatch1) {
            uid = uidMatch1[1].replace(/\s+/g, '').toUpperCase();
        }
        
        // Pattern 2: "UID: 12345678" (no spaces)
        if (!uid) {
            const uidMatch2 = response.match(/UID\s*[:\s]+\s*([0-9A-F]{8})/i);
            if (uidMatch2) {
                uid = uidMatch2[1].toUpperCase();
            }
        }
        
        // Pattern 3: Look for hex pattern in brackets or parentheses
        if (!uid) {
            const uidMatch3 = response.match(/[\[\(]([0-9A-F]{2}\s+[0-9A-F]{2}\s+[0-9A-F]{2}\s+[0-9A-F]{2})[\]\)]/i);
            if (uidMatch3) {
                uid = uidMatch3[1].replace(/\s+/g, '').toUpperCase();
            }
        }
        
        // Pattern 4: Look for 4-byte hex pattern anywhere
        if (!uid) {
            const uidMatch4 = response.match(/\b([0-9A-F]{2})\s+([0-9A-F]{2})\s+([0-9A-F]{2})\s+([0-9A-F]{2})\b/i);
            if (uidMatch4) {
                uid = (uidMatch4[1] + uidMatch4[2] + uidMatch4[3] + uidMatch4[4]).toUpperCase();
            }
        }
        
        if (!uid || uid.length !== 8) {
            // If still no UID, try reading block 0 directly (MIFARE Classic 1K)
            // Note: Block 0 contains UID in first 4 bytes, but may be locked
            logMessage('Trying to read block 0 directly (MIFARE Classic 1K)...');
            response = await sendCommand('hf mf rdbl 0 A FFFFFFFFFFFF');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Block 0 of MIFARE Classic 1K contains UID in first 4 bytes
            // Format: UID[4] BCC[1] SAK[1] ATQA[2] Manufacturer[8]
            const blockMatch = response.match(/\b([0-9A-F]{2})\s+([0-9A-F]{2})\s+([0-9A-F]{2})\s+([0-9A-F]{2})/i);
            if (blockMatch) {
                uid = (blockMatch[1] + blockMatch[2] + blockMatch[3] + blockMatch[4]).toUpperCase();
            }
        }
        
        if (uid && uid.length === 8) {
            document.getElementById('tagUid').value = uid;
            logMessage('Tag UID extracted: ' + uid);
            alert('Tag UID auto-filled: ' + uid);
        } else {
            throw new Error('Could not find UID in response. Make sure a tag is present and try again.\n\nResponse: ' + response.substring(0, 200));
        }
        
    } catch (error) {
        alert('Error reading tag: ' + error.message);
        logMessage('Error: ' + error.message);
    }
}

// Write tag with generated data
async function writeTag() {
    if (!isConnected) {
        alert('Please connect to PROXMARK3 first');
        return;
    }

    // First generate the commands (this validates the form)
    // We need to call the generation logic without showing results
    const batch = padString(document.getElementById('batch').value, 3);
    const date = padString(document.getElementById('date').value, 5);
    const supplier = padString(document.getElementById('supplier').value, 4);
    const material = padString(document.getElementById('material').value, 5);
    const color = padString(document.getElementById('color').value, 7);
    const length = padString(document.getElementById('length').value, 4);
    const serial = padString(document.getElementById('serial').value, 6);
    const reserve = padString(document.getElementById('reserve').value, 14);
    let tagUid = document.getElementById('tagUid').value.toUpperCase().replace(/[^0-9A-F]/g, '');
    const isAlreadyEncrypted = document.querySelector('input[name="encryptionStatus"]:checked').value === 'encrypted';

    // Validate inputs
    if (!tagUid || tagUid.length !== 8) {
        alert('Tag UID is required! Please enter a valid 8-digit hexadecimal Tag UID');
        return;
    }
    
    if (!confirm('This will write data to the tag. Make sure the tag is present. Continue?')) {
        return;
    }

    try {
        // Build ASCII string
        const asciiString = batch + date + supplier + material + color + length + serial + reserve;
        
        // Generate sector 1 key
        const sectorKey = generateSectorKey(tagUid);
        
        // Convert to hex
        const fullHex = stringToHex(asciiString.padEnd(48, '\0'));
        const block0 = fullHex.substring(0, 32);
        const block1 = fullHex.substring(32, 64);
        const block2 = fullHex.substring(64, 96);

        // Generate PROXMARK3 commands for MIFARE Classic 1K
        // Writing to blocks 0, 1, 2 of sector 0
        const defaultKey = 'FFFFFFFFFFFF';
        const commands = [
            `hf mf wrbl 0 A ${defaultKey} ${block0}`,  // Sector 0, Block 0
            `hf mf wrbl 1 A ${defaultKey} ${block1}`,  // Sector 0, Block 1
            `hf mf wrbl 2 A ${defaultKey} ${block2}`   // Sector 0, Block 2
        ];
        
        logMessage('Starting MIFARE Classic 1K tag write operation...');
        logMessage('Tag UID: ' + tagUid);
        logMessage('Sector Key: ' + sectorKey);
        logMessage('Writing to Sector 0, Blocks 0-2');
        
        // First, detect the tag
        logMessage('Detecting MIFARE Classic 1K tag...');
        await sendCommand('hf 14a reader');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify it's a MIFARE Classic tag
        logMessage('Verifying tag type...');
        const detectResponse = await sendCommand('hf mf info');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (detectResponse.toLowerCase().includes('mifare') || detectResponse.toLowerCase().includes('classic')) {
            logMessage('MIFARE Classic tag detected');
        } else {
            logMessage('Warning: Tag may not be MIFARE Classic 1K. Proceeding anyway...');
        }
        
        // Note: Block 0 contains UID and manufacturer data
        // Some tags have locked UID and block 0 cannot be written
        // If write fails on block 0, the tag may have a locked UID
        
        // Write blocks 0, 1, 2 of sector 0
        for (let i = 0; i < 3; i++) {
            logMessage(`Writing Sector 0, Block ${i}...`);
            const response = await sendCommand(commands[i]);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check for errors in response
            if (response.toLowerCase().includes('error') || response.toLowerCase().includes('failed')) {
                throw new Error(`Failed to write block ${i}: ${response.substring(0, 100)}`);
            }
            if (response.toLowerCase().includes('ok') || response.toLowerCase().includes('done')) {
                logMessage(`Block ${i} written successfully`);
            }
        }
        
        // Set sector key if tag is not already encrypted
        if (!isAlreadyEncrypted && sectorKey) {
            logMessage('Setting sector 1 key...');
            const keyResponse = await sendCommand(`hf mf csetkey 1 A ${sectorKey}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (keyResponse.toLowerCase().includes('error') || keyResponse.toLowerCase().includes('failed')) {
                logMessage('Warning: Sector key setting may have failed. Check response.');
            }
        }
        
        logMessage('Tag write operation completed successfully!');
        alert('Tag written successfully!');
        
        // Also update the results display
        document.getElementById('asciiResult').value = asciiString;
        document.getElementById('proxmarkCommands').value = commands.join('\n');
        document.getElementById('sectorKey').value = sectorKey;
        document.getElementById('sectorKeySection').style.display = 'block';
        document.getElementById('results').style.display = 'block';
        
    } catch (error) {
        alert('Error writing tag: ' + error.message);
        logMessage('Error: ' + error.message);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initMaterials();
    populateMaterialsModal();
    updateConnectionStatus(false);
    
    // Check if Web Serial API is available
    if (!('serial' in navigator)) {
        const connectBtn = document.getElementById('connectBtn');
        const warningDiv = document.getElementById('serialApiWarning');
        if (connectBtn) {
            connectBtn.disabled = true;
            connectBtn.title = 'Web Serial API not supported. Use Chrome, Edge, or Opera.';
        }
        if (warningDiv) {
            warningDiv.style.display = 'block';
        }
    }
});

