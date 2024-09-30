document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');

    if (!form) {
        console.error('Login form element not found!');
        return;
    }

    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const authMsg = document.getElementById('auth-msg');

    

        try {
            const response = await fetch('http://localhost:4000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log(data);
        

            if (response.ok) {
                authMsg.textContent = 'Login successful';
                authMsg.style.color = 'green';
                authMsg.style.display = 'block';
                // Redirect to another page or handle the login success
                // Redirect to index.html (the main page)
                console.log('redirecting to index.html')
                window.location.href = 'index.html';

            } else {
                authMsg.textContent = 'Login failed';
                authMsg.style.color = 'red';
                authMsg.style.display = 'block';
            }
        } catch (err) {
            authMsg.textContent = 'Failed to communicate with the server';
            authMsg.style.color = 'red';
            authMsg.style.display = 'block';
        }
    });
});