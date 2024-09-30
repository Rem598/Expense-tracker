document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form');
   

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const authMsg = document.getElementById('auth-msg');

        try {
            const response = await fetch('http://localhost:4000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, username, password })
            });

            const data = await response.json();
            console.log(data)

            if (response.ok) {
                authMsg.textContent = data.message || 'User registered successfully';
                authMsg.style.color = 'orange';
                authMsg.style.display = 'block';

                console.log('redirecting to login.html')
                window.location.href = 'login.html';
            } else {
                authMsg.textContent = data.message || 'User already exists';
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