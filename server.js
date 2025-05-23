const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');
const session = require('express-session'); // Import express-session


const port = process.env.PORT || 4000;

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Initialize Redis Store in session middleware
app.use(session({
    secret: process.env.SESSION_SECRET, // Ensure SESSION_SECRET is set in .env
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Change to true if using HTTPS
}));

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/index.html');
}

// MySQL connection
const ddb = mysql.createConnection({
    host: process.env.DDB_HOST,
    user: process.env.DDB_USER,
    password: process.env.DDB_PASSWORD
});

ddb.connect((err) => {
    if (err) return console.log("Error connecting to MySQL:", err);

    console.log("Connected to MySQL: ", ddb.threadId);

    // Create a database if it doesn't exist
    ddb.query(`CREATE DATABASE IF NOT EXISTS expenses_tracker`, (err) => {
        if (err) return console.log(err);

        console.log("Database expenses_tracker created successfully");

        // Select our database
        ddb.changeUser({ database: 'expenses_tracker' }, (err) => {
            if (err) return console.log(err);

            console.log("Changed to expenses_tracker");

            // Create users table
            const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL
            )`;
            const createTableQuery = `
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                date DATE NOT NULL,
                type ENUM('Income', 'Expense') NOT NULL,
                category VARCHAR(50) NOT NULL, 
                user_id INT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );`;

            ddb.query(createUsersTable, (err) => {
                if (err) return console.log(err);

                console.log("Users table created");
            });

            ddb.query(createTableQuery, (err) => {
                if (err) {
                    console.error('Failed to create transactions table:', err);
                } else {
                    console.log('Transactions table created or already exists.');
                }
            });
        });
    });
});

// Route for index page (login or register page)
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/homepage.html');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for the homepage content
app.get('/homepage.html', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'homepage.html'));
});

// Define the login route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Define the register route
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Endpoint to get all transactions
app.get('/transactions', ensureAuthenticated, (req, res) => {
    const userId = req.session.user.id; // grab user id from session
    const query = `SELECT * FROM transactions WHERE user_id = ?`;
    

    ddb.query(query, [userId], (err, results) => {
        if (err) {
            console.error("Error fetching transactions:", err);
            return res.status(500).json("Failed to retrieve transactions.");
        }
        res.json(results);
    });
});

// Get category summary
app.get('/category-summary', ensureAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const getSummaryQuery = `
    SELECT category, SUM(amount) AS total 
    FROM transactions 
    WHERE type = 'Expense' AND user_id = ?
    GROUP BY category`;

    ddb.query(getSummaryQuery, [userId], (err, results) => {
        if (err) return res.status(500).json("Failed to fetch category summary");

        res.json(results); 
    });
});
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid'); // make sure the cookie is cleared!
        res.redirect('/index.html');
    });
});


// User registration route
app.post('/register', async (req, res) => {
    try {
        const checkUser = `SELECT * FROM users WHERE email = ?`;

        ddb.query(checkUser, [req.body.email], (err, data) => {
            if (err) return res.status(500).json("Internal server error");

            if (data.length) return res.status(409).json("User already exists");

            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(req.body.password, salt);

            const createUser = `INSERT INTO users (email, username, password) VALUES (?, ?, ?)`;
            const values = [req.body.email, req.body.username, hashedPassword];

            ddb.query(createUser, values, (err) => {
                if (err) return res.status(500).json("Something went wrong");

                return res.status(200).json("User created successfully");
            });
        });
    } catch (err) {
        res.status(500).json("Internal server error");
    }
});

// User login route
app.post('/login', async (req, res) => {
    try {
        const checkUser = `SELECT * FROM users WHERE email = ?`;

        ddb.query(checkUser, [req.body.email], (err, data) => {
            if (err) return res.status(500).json("Internal server error");

            if (data.length === 0) return res.status(404).json("User not found");

            // Check if password is valid
            const user = data[0];
            const isPasswordValid = bcrypt.compareSync(req.body.password, user.password);

            if (!isPasswordValid) return res.status(400).json("Invalid email or password");

            req.session.user = user;  // Create a session for the user
            console.log('Session after login:', req.session);  // Debug session
            res.status(200).json({ message: "Login successful", redirectUrl: 'homepage.html' });
        });
    } catch (err) {
        res.status(500).json("Internal server error");
    }
});

// Endpoint to add a new transaction
app.post('/transactions', ensureAuthenticated, (req, res) => {
    const { name, amount, date, type, category } = req.body;
    const userId = req.session.user.id; // grab user ID from session

    if (!name || !amount || !date || !type || !category) {
        return res.status(400).json("All fields are required.");
    }

    const insertTransactionQuery = `
        INSERT INTO transactions (name, amount, date, type, category, user_id)
        VALUES (?, ?, ?, ?, ?, ?)`;

    ddb.query(insertTransactionQuery, [name, amount, date, type, category, userId], (err, result) => {
        if (err) {
            console.error("Error inserting transaction:", err);
            return res.status(500).json("Failed to add transaction.");
        }

        res.status(201).json({ message: "Transaction added successfully", transactionId: result.insertId });
    });
});


// Function to convert DD/MM/YYYY to YYYY-MM-DD
function convertToYYYYMMDD(dateString) {
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
}

// Logout

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
