const askBtn = document.getElementById("askBtn");
const questionInput = document.getElementById("question");
const loader = document.getElementById("loader");
const quoteDiv = document.getElementById("quote");
const answerBox = document.getElementById("answerBox");
const answerText = document.getElementById("answerText");
const closeBtn = document.getElementById("closeBtn");

const quotes = [
  "Great things take time...",
  "The AI is thinking harder than usual...",
  "Asking smart questions is the beginning of wisdom.",
  "Hang tight, we are fetching brilliance."
];

function showQuote() {
  quoteDiv.textContent = quotes[Math.floor(Math.random() * quotes.length)];
}

questionInput.addEventListener("input", () => {
  const text = questionInput.value.trim();

  if (text === "") {
    // Clear answer box if question input is empty
    answerText.textContent = "";
    answerBox.style.display = "none";

    // Optionally remove answer from local storage too
    chrome.storage.local.get(["currentVideoInfo"], (result) => {
      const info = result.currentVideoInfo || {};
      delete info.answer;
      delete info.question;
      chrome.storage.local.set({ currentVideoInfo: info });
    });
  }
});

askBtn.addEventListener("click", () => {
  const question = questionInput.value.trim();
  if (!question) {
    alert("Please enter a question.");
    return;
  }

  chrome.storage.local.get(["currentVideoInfo"], (data) => {
    const currentInfo = data.currentVideoInfo || {};
    const videoId = currentInfo.id;

    if (!videoId) {
      answerText.textContent = "No video detected yet. Please open a YouTube video page.";
      loader.style.display = "none";
      answerBox.style.display = "block";
      return;
    }

    loader.style.display = "block";
    answerBox.style.display = "none";
    showQuote();

    // Send message to background to process question and get answer
    chrome.runtime.sendMessage({
      action: "askQuestion",
      videoId,
      question
    });
  });
});

// closeBtn.addEventListener("click", () => {
//   answerBox.style.display = "none";
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "answerReady") {
    answerBox.style.display = "block";
    loader.style.display = "none";
    answerText.textContent = message.answer;
  }
});

// Show stored answer if present on popup load
window.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["currentVideoInfo"], (data) => {
    const info = data.currentVideoInfo;
    if (info?.answer) {
      loader.style.display = "none";
      answerBox.style.display = "block";
      answerText.textContent = info.answer;
    }
    if (info?.question) {
      questionInput.value = info.question;
    }
  });

  const askBtn = document.getElementById("askBtn");
  const statusMsg = document.getElementById("statusMsg");

  // Initial check for transcript readiness
  chrome.storage.local.get(["currentVideoInfo"], (data) => {
    const info = data.currentVideoInfo || {};
    if (info.processed === true) {
      askBtn.disabled = false;
      statusMsg.textContent = ""; // clear message
    } else {
      askBtn.disabled = true;
      statusMsg.textContent = "Getting the transcript ready...";
    }
  });
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "transcriptReady") {
      askBtn.disabled = false;
      statusMsg.textContent = "";
    }
  })
});