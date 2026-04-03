document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    
    // 1. Populate UI
    const fields = ['username', 'user_id', 'auth_code', 'hash'];
    fields.forEach(field => {
        const value = params.get(field);
        const element = document.getElementById(field);
        if (element) {
            element.textContent = value || "Not provided";
        }
    });

    // 2. Hash Verification Logic
    async function calculateSHA256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    document.getElementById('verify_btn').addEventListener('click', async () => {
        const saltSecret = document.getElementById('salt_input').value;
        const resultBox = document.getElementById('result_box');
        const statusMessage = document.getElementById('status_message');
        const calcHashDisplay = document.getElementById('calc_hash_display');
        
        if (!saltSecret) return alert("Please enter a salt secret.");

        const userId = params.get('user_id') || '';
        const username = params.get('username') || '';
        const authCode = params.get('auth_code') || '';
        const providedHash = params.get('hash') || '';

        const stringToHash = `${userId},${username},${authCode},${saltSecret}`;
        
        try {
            const computedHash = await calculateSHA256(stringToHash);
            resultBox.classList.remove('hidden');
            calcHashDisplay.textContent = computedHash;

            if (computedHash === providedHash && providedHash !== '') {
                statusMessage.className = 'success';
                statusMessage.textContent = '✅ Success! Hashes match.';
            } else {
                statusMessage.className = 'error';
                statusMessage.textContent = '❌ Mismatch! Hashes do not match.';
            }
        } catch (error) {
            console.error("Hashing failed:", error);
        }
    });

    // 3. API Fetching & Table Rendering Logic
    document.getElementById('fetch_api_btn').addEventListener('click', async () => {
        const clientId = document.getElementById('client_id_input').value;
        const clientSecret = document.getElementById('client_secret_input').value;
        const authCode = params.get('auth_code');
        const apiStatus = document.getElementById('api_status');
        
        // UI Sections
        const actionSections = document.getElementById('action_sections');
        const resultsSection = document.getElementById('results_section');
        const tableBody = document.getElementById('course_table_body');
        
        // Define your Docebo domain here
        const doceboDomain = 'https://mj-michael-james-demo.docebosaas.com';

        if (!clientId || !clientSecret || !authCode) {
            alert("Client ID, Client Secret, and a valid Auth Code from the URL are required.");
            return;
        }

        try {
            apiStatus.textContent = "Exchanging auth code for token...";
            
            const tokenBody = new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'authorization_code',
                code: authCode
            });

            const tokenResponse = await fetch(`${doceboDomain}/oauth2/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenBody
            });

            if (!tokenResponse.ok) {
                const errText = await tokenResponse.text();
                throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errText}`);
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            apiStatus.textContent = "Token received! Fetching transcript...";
            
            const transcriptResponse = await fetch(`${doceboDomain}/report/v1/mytranscript?page=1&page_size=100`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!transcriptResponse.ok) {
                throw new Error(`Transcript fetch failed: ${transcriptResponse.status}`);
            }

            const transcriptData = await transcriptResponse.json();
            const allItems = transcriptData.data.items;
            
            // NEW FILTER: Must be completed AND have a certificate
            const certifiedCourses = allItems.filter(item => 
                item.completion_date !== null && 
                (item.has_certificate === true || item.certificate_url !== null)
            );
            
            // Clear out any old rows
            tableBody.innerHTML = ''; 

            if (certifiedCourses.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No certified courses found.</td></tr>';
            } else {
                // Build the table rows
                certifiedCourses.forEach(course => {
                    const tr = document.createElement('tr');
                    
                    // 1. Setup Certificate URL
                    const fullCertUrl = course.certificate_url.startsWith('http') 
                        ? course.certificate_url 
                        : `${doceboDomain}${course.certificate_url}`;
                    const certHtml = `<a href="${fullCertUrl}" target="_blank" class="cert-btn">Download</a>`;

                    // 2. Setup Course Link
                    const courseLink = `${doceboDomain}/learn/courses/${course.id}/${course.slug}`;

                    // 3. Inject into the table row
                    tr.innerHTML = `
                        <td><a href="${courseLink}" target="_blank" class="course-link">${course.name}</a></td>
                        <td>${course.type.toUpperCase()}</td>
                        <td>${course.completion_date.split(' ')[0]}</td>
                        <td>${certHtml}</td>
                    `;
                    tableBody.appendChild(tr);
                });
            }

            // SUCCESS FLOW: Hide the action inputs and show the table
            actionSections.classList.add('hidden');
            resultsSection.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            apiStatus.textContent = `Error: ${error.message}`;
            apiStatus.style.color = "#721c24";
        }
    });
});