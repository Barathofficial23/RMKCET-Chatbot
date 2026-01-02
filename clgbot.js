import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

const openChatBtn = document.getElementById('openChatBtn');
const chatContainer = document.getElementById('chatContainer');
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');

let genAI;
let model;
let chat;
let systemInstruction = "";
let totalUsedTokens = 0;

// Load instruction file
async function loadInstructions() {
  const res = await fetch("instructions.txt");
  systemInstruction = await res.text();
}

// Load API key from config.json
async function loadAPIKey() {
  const res = await fetch("api-key.json");
  const data = await res.json();
  return data.API_KEY;
}

// Load Gemini model and system instruction
async function initializeModel() {
  try {
    const apiKey = await loadAPIKey();
    genAI = new GoogleGenerativeAI(apiKey);
    await loadInstructions();

    model = await genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite-preview-06-17",
      systemInstruction: systemInstruction
    });

    console.log("RMKCET BOT Initialized");

  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

// Initialize on page load
initializeModel();

//Click to Open chatbot
openChatBtn.addEventListener('click', () => {
  openChatBtn.style.display = 'none';
  chatContainer.style.display = 'flex';
  console.log("Chatbot Opened");
});

//Click Outside the container to close the Chatbot
document.addEventListener('click', function (event) {
  const isClickInsideChat = chatContainer.contains(event.target);
  const isClickOnButton = openChatBtn.contains(event.target);

  if (!isClickInsideChat && !isClickOnButton) {
    chatContainer.classList.add('fade-out');
    chatContainer.addEventListener('animationend', () => {
      chatContainer.style.display = 'none';
      chatContainer.classList.remove('fade-out');
      openChatBtn.style.display = 'flex';
    }, { once: true });
  }
});



//Function to Send Message
async function sendMessage(customText = null) {
  const text = customText || userInput.value.trim();
  if (text === '') return;

  appendMessage('user', text);
  console.log("User sent:",text);
  userInput.value = '';

  try {
    const result = await model.generateContent(text); 
    const response = result.response.text();

    //Token usage tracking
    if(result.usageMetadata){
      const inputTokens = result.usageMetadata.promptTokenCount || 0;
      const outputTokens = result.usageMetadata.candidatesTokenCount || 0;
      const totalTokens = result.usageMetadata.totalTokenCount || (inputTokens + outputTokens);
      totalUsedTokens += totalTokens;
      console.log("Input Tokens:", inputTokens);
      console.log("Output Tokens:", outputTokens);
      console.log("Total Tokens (this request):", totalTokens);
      console.log("Total Tokens (all requests):", totalUsedTokens);
  }
    appendMessage('bot', response || "Sorry, I couldn't understand.");
    console.log("Bot's Reply:",response);
  } catch (error) {
    console.error(error);

    if (
      error.message.includes("429") ||
      error.toString().includes("rate") ||
      error.toString().toLowerCase().includes("too many requests")
    ) {
      appendMessage('bot', 'Too many requests to RMKCET BOT. Please try again after some time.');
      console.warn("Rate limit reached. Check API key Usage.");
    } else {
      appendMessage('bot', 'Something went wrong. Please try again later.');
    }
  }
}

//Function to Append Message
function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;

  if (sender === 'bot') {
    // Step 1: Convert Markdown or raw links to clickable "Click here"
    const urlRegex = /\[.*?\]\((.*?)\)|https?:\/\/[^\s)]+/g;
    let processedText = text.replace(urlRegex, (match, group1) => {
      const url = group1 || match;
      return `<a href="${url}" target="_blank" style="color: #005577; text-decoration: underline;">Click here\n</a>`;
    });

    // Step 2: Remove Markdown bullets/stars and stray symbols
    processedText = processedText
      .replace(/\*\*|[*•]/g, '')      // remove bold markers and bullets
      .replace(/^\s*\[|\[\s*/g, '')   // remove stray opening brackets
      .replace(/\s*\]$/, '');         // remove stray closing brackets at the end

    msg.innerHTML = processedText.trim();
  } else {
    msg.innerText = text;
  }

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}


//Enter to send message
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

//Function for default Labels
function initialOptions(id) {
  console.log("Button clicked:", id);
  const chatMessages = document.getElementById("chatMessages");
  //Create the container div with class "defaultOptions"
  const container = document.createElement("div");
  container.className = "defaultOptions";
  container.style.justifyContent = "left";
  container.style.maxWidth = "75%";

  const messageDiv = document.createElement("div");
    messageDiv.className = "message bot";
    messageDiv.innerText = id === "departments"
    ? "📚 Here are the departments in RMKCET👇"
    : "📁 You can directly go to your department's digital notes page from below 👇\n\nOr type:\n- 'I need digital notes for [Exact-Subject-name] (or) [Subject-code] with [Department-name]'\n- 'Ex: Give me unit 1 notes for Computer Networks from CSE Department'";
    chatMessages.appendChild(messageDiv);      

  // Define link data
  let items = [];

  if (id === "departments") {
    items = [
      { name: "CSE", url: "https://www.rmkcet.ac.in/cse-department.php" },
      { name: "ECE", url: "https://www.rmkcet.ac.in/ece-department.php" },
      { name: "AIDS", url: "https://www.rmkcet.ac.in/aids-department.php" },
      { name: "CSE(CS)", url: "https://www.rmkcet.ac.in/cybersecurity-department.php" },
      { name: "Mech.", url: "https://www.rmkcet.ac.in/mech-department.php" },
      { name: "S&H", url: "https://www.rmkcet.ac.in/sh-department.php" },
      { name: "VLSI", url: "https://www.rmkcet.ac.in/vlsi-department.php" }
    ];
  }

  if (id === "materials") {
    items = [
      { name: "CSE", url: "https://rmkcet.ac.in/cse-student-resources.php" },
      { name: "ECE", url: "https://rmkcet.ac.in/ece-resources.php" },
      { name: "AIDS", url: "https://rmkcet.ac.in/aids-resources.php" },
      { name: "CSE(CS)", url: "https://rmkcet.ac.in/cyber-resources.php" },
      { name: "Mech.", url: "https://rmkcet.ac.in/mech-study-materials.php" },
      { name: "S&H", url: "https://rmkcet.ac.in/sh-student-resources.php" },
      { name: "VLSI", url: "https://rmkcet.ac.in/vlsi-academics.php" }
    ];
  }

  // Create and append <a> elements with class "defaultInput"
  items.forEach(item => {
    const link = document.createElement("a");
    link.href = item.url;
    link.innerText = item.name;
    link.className = "defaultInput";
    link.target = "_blank";
    container.appendChild(link);
  });

  // Append the container to the chat messages
  chatMessages.appendChild(container);
  }

  //Loads when the Website opens 
  window.onload = () => {
    document.getElementById("send").addEventListener("click", () => sendMessage());
    document.getElementById("departments").addEventListener("click", () => initialOptions("departments"));
    document.getElementById("materials").addEventListener("click", () => initialOptions("materials"));
    console.log("Chatbot Initialized");
};