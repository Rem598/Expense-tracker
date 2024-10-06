document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const balance = document.getElementById('balance');
    const income = document.getElementById('income');
    const expense = document.getElementById('expense');
    const transactionList = document.getElementById('transaction-list');
    const transactionForm = document.getElementById('transactionForm');
    const notification = document.getElementById('auth-msg');
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');

    
    
    // Debugging: Ensure elements are found
    if (!balance) console.error('Balance element not found');
    if (!income) console.error('Income element not found');
    if (!expense) console.error('Expense element not found');
    if (!transactionList) {
        console.error('Transaction list element not found');
        return;
    }

    let transactions = []; // Initialize transactions array

    // Function to fetch transactions from the server
    async function fetchTransactions() {
        try {
            const response = await fetch('http://localhost:4000/transactions');
            
            // Log the response status and text for debugging
            console.log('Response status:', response.status);
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            // Check if the response status is OK
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            // Check if the response is JSON and parse it
            if (response.headers.get('content-type').includes('application/json')) {
                transactions = JSON.parse(responseText);
                updateDOM(transactions);
                
            } else {
                console.error('Expected JSON response');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            const statusElement = document.getElementById('status');
            if (statusElement) {
                statusElement.textContent = 'Failed to fetch transactions.';
                statusElement.style.color = 'red';
                showNotification('Error fetching transactions', 'red');
            }
        }
    }

    // Function to update the DOM with fetched transactions
    function updateDOM(transactions) {
        if (!balance || !income || !expense) {
            console.error('One or more elements (balance, income, expense) are missing in the DOM.');
            return;
        }

        transactionList.innerHTML = ''; // Clear the list
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(transaction => {
            if (transaction.name && transaction.amount) {
                const listItem = document.createElement('li');
                listItem.textContent = `${transaction.name} : $${transaction.amount} [${transaction.category}]`; // Display category
                transactionList.appendChild(listItem);

                if (transaction.type === 'Income') {
                    totalIncome += parseFloat(transaction.amount);
                } else {
                    totalExpense += parseFloat(transaction.amount);
                }
            } else {
                console.error('Transaction data missing:', transaction);
            }
        });

        // Update the balance, income, and expense
        balance.textContent = `$${(totalIncome - totalExpense).toFixed(2)}`;
        income.textContent = `$${totalIncome.toFixed(2)}`;
        expense.textContent = `$${totalExpense.toFixed(2)}`;
    }

    

    // Function to handle form submission
    async function handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(transactionForm);
        const transaction = {
            name: formData.get('name'),
            amount: formData.get('amount'),
            date: formData.get('date'),
            type: formData.get('type') === 'on' ? 'Income' : 'Expense',
            category: formData.get('category') 
        };

        console.log('Captured date:', transaction.date); 

        // Validate form input
        if (!transaction.name || !transaction.amount || !transaction.category) {
            showNotification('Please fill out all fields', 'red');
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transaction),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const newTransaction = await response.json();
            transactions.push(newTransaction); 

            await fetchTransactions();
            updateDOM(transactions);
            
            showNotification('Transaction added successfully', 'green');
        } catch (error) {
            console.error('Error adding transaction:', error);
            showNotification('Error adding transaction', 'red');
        }
    }

    // Function to show notifications
    function showNotification(message, color) {
        notification.textContent = message;
        notification.style.color = color;
        notification.style.display = 'block';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 4000);
    }

    // Event listener for form submission
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleFormSubmit);
    }

    // Fetch transactions on page load
    fetchTransactions();

    // Function to handle login form submission
    const loginForm = document.getElementById('form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
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

                const result = await response.json();

                if (response.ok) {
                    authMsg.textContent = 'Login successful!';
                    authMsg.style.color = 'green';
                    authMsg.style.display = 'block';

                    // Redirect to homepage.html (main page) after a successful login
                    window.location.href = 'homepage.html';
                } else {
                    authMsg.textContent = result.message || 'Login failed';
                    authMsg.style.color = 'red';
                    authMsg.style.display = 'block';
                }
            } catch (error) {
                console.error('Error:', error);
                authMsg.textContent = 'An error occurred. Please try again.';
                authMsg.style.color = 'red';
                authMsg.style.display = 'block';
            }
        });
    } else {
        console.error('Login form element not found');
    }
    

    // Function to handle logout
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Clear session or token (if using authentication)
            window.location.href = '/login.html'; 
        });
    }
});