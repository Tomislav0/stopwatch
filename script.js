const timerElement = document.getElementById('timer');
const counterElement = document.getElementById('counter');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const skipBtn = document.getElementById('skipBtn');
const resetBtn = document.getElementById('resetBtn');
const alarmSound = document.getElementById('alarmSound');

const wallElement = document.getElementById('wall');

const titleElement = document.getElementById('title');

let workTime = 50 * 60; // 50 minutes in seconds
let breakTime = 10 * 60; // 10 minutes in seconds
let timeLeft = workTime;
let isRunning = false;
let interval;
let cycleCounter = 0;
let isBreak = false;

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const updateTimerDisplay = () => {
    timerElement.textContent = formatTime(timeLeft);
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

        cycleCounter++;
        counterElement.textContent = cycleCounter.toString();
        addWorkSessionToWall();
    }
    else {
        timeLeft = breakTime;
        isBreak = true;
        titleElement.textContent = "Break"
    }
};

const startTimer = () => {
    if (!isRunning) {
        isRunning = true;
        interval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();

            if (timeLeft === 0) {
                alarmSound.play();
                if (timeLeft === 0 && !isBreak) {
                    timeLeft = breakTime;
                    isBreak = true;
                    titleElement.textContent = "Break"
                } else {
                    cycleCounter++;
                    counterElement.textContent = cycleCounter.toString();

                    addWorkSessionToWall();
                    timeLeft = workTime;

                    isBreak = false;

                    titleElement.textContent = "Working"
                }
            }
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
