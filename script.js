document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    // 1. Populate the UI with Docebo parameters
    const fields = ['username', 'user_id', 'auth_code', 'hash'];
    fields.forEach(field => {
        const value = params.get(field);
        const element = document.getElementById(field);
        if (element) {
            element.textContent = value || "Not provided";
        }
    });

    // 2. Helper function to calculate SHA-256 in the browser
    async function calculateSHA256(message) {
        // Convert the string to an array of bytes
        const msgBuffer = new TextEncoder().encode(message);
        
        // Hash the bytes using the Web Crypto API
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        
        // Convert the ArrayBuffer to a hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }

    // 3. Handle the Verify button click
    document.getElementById('verify_btn').addEventListener('click', async () => {
        const saltSecret = document.getElementById('salt_input').value;
        const resultBox = document.getElementById('result_box');
        const statusMessage = document.getElementById('status_message');
        const calcHashDisplay = document.getElementById('calc_hash_display');
        
        if (!saltSecret) {
            alert("Please enter a salt secret for the demo.");
            return;
        }

        // Grab exact values from URL (fallback to empty strings if missing)
        const userId = params.get('user_id') || '';
        const username = params.get('username') || '';
        const authCode = params.get('auth_code') || '';
        const providedHash = params.get('hash') || '';

        // Concatenate string for a PAGE widget
        const stringToHash = `${userId},${username},${authCode},${saltSecret}`;
        
        try {
            // Compute the hash
            const computedHash = await calculateSHA256(stringToHash);
            
            // Unhide result box and show calculated hash
            resultBox.classList.remove('hidden');
            calcHashDisplay.textContent = computedHash;

            // Compare and show success/error
            if (computedHash === providedHash && providedHash !== '') {
                statusMessage.className = 'success';
                statusMessage.textContent = '✅ Success! Hashes match. Identity Verified.';
            } else {
                statusMessage.className = 'error';
                statusMessage.textContent = '❌ Mismatch! The hashes do not match.';
            }
        } catch (error) {
            console.error("Hashing failed:", error);
            alert("Error calculating hash. See console for details.");
        }
    });
});