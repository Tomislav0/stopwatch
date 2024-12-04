const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');


const nodemailer = require('nodemailer');
const cors = require('cors');

// Track connected clients
let clients = [];

const app = express();
const PORT = 3000;

const wss = new WebSocket.Server({ noServer: true });
// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

require('dotenv').config();
const origins = process.env.CORS_ORIGINS.split(';');
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || origins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true,
}));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the messages file
app.get('/messages', (req, res) => {
    fs.readFile('messages.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Failed to read messages:', err);
            res.status(500).send('Failed to load messages.');
        } else {
            res.status(200).send(data);
        }
    });
});

// Function to format the current date and time
const formatDateTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const year = now.getFullYear();

    return `${hours}:${minutes}, ${day}.${month}.${year}`;
};

// Endpoint to handle message submission
app.post('/send-message', (req, res) => {
    const { username, message } = req.body;
    const timestamp = formatDateTime();
    const formattedMessage = `<div style="text-align: left"><span class="message-username"> ${username}</span>: <span class="message-text"> ${message.replace(/\n/g, '<br>')}</span></div><span class="timestamp">${timestamp}</span> \n`;

    // Append the message to messages.txt
    fs.appendFile('messages.txt', formattedMessage, (err) => {
        if (err) {
            console.error('Failed to save message:', err);
            res.status(500).send('Failed to save message.');
        } else {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(formattedMessage);
                }
            });
            res.status(200).send('Message saved.');
        }
    });
});

app.post('/send-email', async (req, res) => {

    const reCaptchaParams = new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET,
        response: req.body.gRecaptchaResponse,
    });
    const captchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify',
        { method: 'POST', body: reCaptchaParams })
        .then(res => res.json());

    if (!captchaResponse.success) {
        return res.status(400).send({ error: 'Failed to verify reCAPTCHA.' });
    }
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).send({ error: 'All fields are required.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: `NOVA PORUKA SA STRANICE OD ${name}`,
        text: `Name: ${name}\n
        Email: ${email}\n
        Message:\n ${message}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send({ success: 'Email sent successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to send email.' });
    }
});



// Handle WebSocket connections
app.server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


app.server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

const broadcastUserCount = () => {
    const userCount = clients.length;
    const message = JSON.stringify({ type: 'userCount', count: userCount });
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

wss.on('connection', (ws) => {
    // Add new client to the list
    clients.push(ws);

    // Send the updated user count
    broadcastUserCount();

    ws.on('close', () => {
        // Remove the client from the list when disconnected
        clients = clients.filter(client => client !== ws);

        // Send the updated user count
        broadcastUserCount();
    });
});