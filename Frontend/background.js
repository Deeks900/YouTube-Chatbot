// Inject popup when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('youtube.com')) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: injectPopup
    });
  }
});

function injectPopup() {
  if (document.getElementById('ai-chatbot-popup')) return; // Already injected

  const popup = document.createElement('div');
  popup.id = 'ai-chatbot-popup';
  popup.innerHTML = `
    <style>
      #ai-chatbot-popup {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        height: 450px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 15px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        overflow: hidden;
      }
      .popup-header {
        padding: 15px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 15px 15px 0 0;
      }
      .popup-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        color: white;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;
      }
      .close-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      .popup-content {
        padding: 20px;
        height: calc(100% - 70px);
        display: flex;
        flex-direction: column;
      }
      .input-group {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
      }
      #question-input {
        flex: 1;
        padding: 12px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        transition: border 0.3s;
      }
      #question-input:focus {
        border-color: #667eea;
      }
      #ask-btn {
        padding: 12px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #ask-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      #ask-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      #status {
        font-size: 14px;
        color: #666;
        margin-bottom: 10px;
        min-height: 20px;
      }
      #answer {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        overflow-y: auto;
        padding: 10px;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 8px;
        border: 1px solid rgba(0, 0, 0, 0.05);
      }
      .loader {
        display: none;
        justify-content: center;
        align-items: center;
        margin-bottom: 10px;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
    <div class="popup-header">
      <h3>AI Video Q&A</h3>
      <button class="close-btn" id="close-popup">&times;</button>
    </div>
    <div class="popup-content">
      <div class="input-group">
        <input type="text" id="question-input" placeholder="Ask your question..." />
        <button id="ask-btn">Ask</button>
      </div>
      <div class="loader" id="loader">
        <div class="spinner"></div>
        <span>Thinking...</span>
      </div>
      <div id="status"></div>
      <div id="answer"></div>
    </div>
  `;
  document.body.appendChild(popup);

  // Add event listeners
  document.getElementById('close-popup').addEventListener('click', () => {
    popup.remove();
  });

  const questionInput = document.getElementById('question-input');
  const askBtn = document.getElementById('ask-btn');
  const statusDiv = document.getElementById('status');
  const answerDiv = document.getElementById('answer');
  const loader = document.getElementById('loader');

  // Get video ID
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get('v');

  if (!videoId) {
    statusDiv.textContent = 'No video ID found.';
    askBtn.disabled = true;
    return;
  }

  // Process transcript if not done
  statusDiv.textContent = 'Processing transcript... (Free Pinecone version may take longer)';
  askBtn.disabled = true;
  chrome.runtime.sendMessage({ action: 'processTranscript', videoId }, (response) => {
    if (response.success) {
      statusDiv.textContent = 'Ready to ask questions!';
      askBtn.disabled = false;
    } else {
      statusDiv.textContent = response.error || 'Failed to process transcript.';
      askBtn.disabled = true;
    }
  });

  // Handle ask button
  askBtn.addEventListener('click', () => {
    const question = questionInput.value.trim();
    if (!question) {
      alert("Please enter a question.");
      return;
    }

    askBtn.disabled = true;
    loader.style.display = 'flex';
    statusDiv.textContent = '';
    answerDiv.textContent = '';

    chrome.runtime.sendMessage({ action: 'askQuestion', videoId, question }, (response) => {
      loader.style.display = 'none';
      askBtn.disabled = false;
      answerDiv.textContent = response.answer || 'No answer.';
    });
  });

  // Allow Enter key
  questionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      askBtn.click();
    }
  });
}

// Handle messages from injected script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'processTranscript') {
    fetch(`http://127.0.0.1:5000/processTranscript?videoId=${message.videoId}`)
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ success: false, error: 'Network error' }));
    return true; // Keep message channel open
  }
  if (message.action === 'askQuestion') {
    fetch(`http://127.0.0.1:5000/answerQuestion?videoId=${message.videoId}&question=${encodeURIComponent(message.question)}`)
      .then(r => r.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ answer: 'Network error' }));
    return true;
  }
});