const display = document.getElementById("display");
const startStopBtn = document.getElementById("startStop");
const resetBtn = document.getElementById("reset");
const plusMinuteBtn = document.getElementById("plusMinute");
const minusMinuteBtn = document.getElementById("minusMinute");

let remainingSeconds = 0;
let intervalId = null;

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutesPart = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const secondsPart = String(safeSeconds % 60).padStart(2, "0");
  return `${minutesPart}:${secondsPart}`;
};

const render = () => {
  display.textContent = formatTime(remainingSeconds);
};

const stopTimer = () => {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  startStopBtn.textContent = "Start";
};

const tick = () => {
  if (remainingSeconds > 0) {
    remainingSeconds -= 1;
    render();
  }

  if (remainingSeconds === 0) {
    stopTimer();
  }
};

startStopBtn.addEventListener("click", () => {
  if (intervalId === null) {
    if (remainingSeconds === 0) {
      return;
    }
    intervalId = setInterval(tick, 1000);
    startStopBtn.textContent = "Stop";
  } else {
    stopTimer();
  }
});

resetBtn.addEventListener("click", () => {
  stopTimer();
  remainingSeconds = 0;
  render();
});

plusMinuteBtn.addEventListener("click", () => {
  remainingSeconds += 60;
  render();
});

minusMinuteBtn.addEventListener("click", () => {
  remainingSeconds = Math.max(0, remainingSeconds - 60);
  render();
});

render();
