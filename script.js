
document.addEventListener('DOMContentLoaded', () => {


    const timerElement = document.getElementById('timer');
    const counterElement = document.getElementById('counter');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const skipBtn = document.getElementById('skipBtn');
    const resetBtn = document.getElementById('resetBtn');
    const alarmSound = document.getElementById('alarmSound');
    const wallElement = document.getElementById('wall');
    const titleElement = document.getElementById('title');
    const headTitleElement = document.getElementById('headTitle');

    const stopwatchDiv = document.querySelector('.stopwatch');

    const messageDisplay = document.getElementById('messageDisplay');
    const sendBtn = document.getElementById('sendBtn');
    const messageElement = document.getElementById('message');

    let workTime = 50 * 60; // 50 minutes in seconds
    let breakTime = 10 * 60; // 10 minutes in seconds
    let timeLeft = workTime;
    let isRunning = false;
    let interval;
    let cycleCounter = 0;
    let isBreak = false;
    // List of random usernames
    const usernames = [
        'AnonymousEagle', 'MysteriousCat', 'SilentWolf', 'HiddenShadow', 'CleverFox',
        'SneakyNinja', 'MaskedOwl', 'InvisibleTiger', 'ShadowDragon', 'GhostRaven'
    ];

    // Function to get or generate a random username
    const getUsername = () => {
        let username = localStorage.getItem('anonymousUsername');
        if (!username) {
            username = usernames[Math.floor(Math.random() * usernames.length)];
            localStorage.setItem('anonymousUsername', username);
        }
        return username;
    };
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const updateTimerDisplay = () => {
        timerElement.textContent = formatTime(timeLeft);

        headTitleElement.textContent = formatTime(timeLeft).toString() + (isBreak ? ' - Break' : ' - Working');
    };

    const pauseTimer = () => {
        if (isRunning) {
            isRunning = false;
            clearInterval(interval);
        }
    };

    const skipTimer = () => {
        timeLeft = 0;
        if (isBreak) {
            timeLeft = workTime;
            isBreak = false;
            titleElement.textContent = "Working"

        }
        else {
            timeLeft = breakTime;
            isBreak = true;
            titleElement.textContent = "Break"

            addWorkSessionToWall();
            cycleCounter++;

            counterElement.textContent = cycleCounter.toString();
        }
    };

    const startTimer = () => {
        if (!isRunning) {
            isRunning = true;

            // stopwatchDiv.classList.add('ticking');
            // stopwatchDiv.style.setProperty('--total-time', `${workTime}s`);

            interval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();

                if (timeLeft === 0) {
                    alarmSound.play();
                    if (timeLeft === 0 && !isBreak) {
                        timeLeft = breakTime;
                        isBreak = true;
                        titleElement.textContent = "Break"
                        cycleCounter++;
                        addWorkSessionToWall();
                    } else {
                        counterElement.textContent = cycleCounter.toString();

                        timeLeft = workTime;

                        isBreak = false;

                        titleElement.textContent = "Working"
                    }
                }
                // stopwatchDiv.style.setProperty('--total-time', `${timeLeft}s`); // Update animation duration

            }, 1000);
        }
    };

    const addWorkSessionToWall = () => {
        wallElement.textContent += 'I ';
    };

    const resetTimer = () => {
        isRunning = false;
        clearInterval(interval);
        timeLeft = workTime;
        cycleCounter = 0;
        updateTimerDisplay();
        counterElement.textContent = cycleCounter.toString();

        wallElement.textContent = ''; // Clear the wall
    };

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    skipBtn.addEventListener('click', skipTimer);
    resetBtn.addEventListener('click', resetTimer);

    updateTimerDisplay();

    const loadMessages = () => {
        fetch('/messages')
            .then(response => response.text())
            .then(data => {
                console.log(data)
                const messages = data.split('\n').filter(message => message.trim() !== '');
                messageDisplay.innerHTML = messages.map(msg => `<div class="message">${msg}</div>`).join('');
                messageDisplay.scrollTop = messageDisplay.scrollHeight; // Scroll to bottom
            })
            .catch(error => console.error('Error fetching messages:', error));
    };

    // Load messages on page load
    window.onload = loadMessages;

    // Send a new message
    sendBtn.addEventListener('click', function () {
        sendMessage();
    });

    const sendMessage = () => {
        const message = messageElement.value;
        if (message.trim()) {
            const username = getUsername();
            fetch('/send-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, message })
            }).then(response => {
                if (response.ok) {
                    messageElement.value = ''; // Clear textarea
                    loadMessages(); // Reload messages to include the new one
                } else {
                    alert('Failed to send message.');
                }
            });
        } else {
            alert('Message cannot be empty!');
        }
    }



    // Handle "Enter" key press
    document.getElementById('message').addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) { // Check if "Enter" is pressed without Shift (to allow new lines)
            event.preventDefault(); // Prevent the default "Enter" key action (like adding a new line)
            sendMessage(); // Call sendMessage function
        }
    });


    // const ws = new WebSocket('ws://localhost:3000');

    const ws = new WebSocket('wss://stopwatch-g8bh.onrender.com');

    ws.onopen = () => {
        console.log('WebSocket connection established');
    };
    // Handle incoming messages
    ws.onmessage = (event) => {
        console.log(event)
        const messagesContainer = document.getElementById('messages-container');
        messageDisplay.innerHTML += `<div class="message">${event.data}</div>`; // Append new message
        messageDisplay.scrollTop = messageDisplay.scrollHeight; // Auto-scroll to bottom
    };

    // Optional: Handle WebSocket errors
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    // Optional: Handle WebSocket close
    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };

    // Toggle chat visibility
    const toggleChatButton = document.getElementById('toggle-chat');
    const chatContainer = document.getElementsByClassName('chat-container')[0];

    const placeholder = document.getElementsByClassName('placeholder')[0];

    toggleChatButton.addEventListener('click', () => {
        console.log("cick")
        if (chatContainer.classList.contains('hidden')) {
            chatContainer.classList.remove('hidden');
            placeholder.classList.remove('hidden');
            toggleChatButton.textContent = 'Hide Chat';
        } else {
            chatContainer.classList.add('hidden');
            placeholder.classList.add('hidden');
            toggleChatButton.textContent = 'Show Chat';
        }
    });
})
