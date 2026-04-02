document.addEventListener('DOMContentLoaded', () => {
    // 1. Grab the query parameters from the URL
    const params = new URLSearchParams(window.location.search);

    // 2. Define the keys we expect from Docebo
    const fields = ['username', 'user_id', 'course_id', 'auth_code', 'hash'];

    // 3. Loop through and update the UI
    fields.forEach(field => {
        const value = params.get(field);
        const element = document.getElementById(field);

        if (element) {
            if (value) {
                element.textContent = value;
            } else {
                element.textContent = "Not provided";
                element.style.color = "#ccc";
            }
        }
    });

    // Logging for your debugging (Check browser console)
    console.log("Data received from Docebo:", Object.fromEntries(params));
});