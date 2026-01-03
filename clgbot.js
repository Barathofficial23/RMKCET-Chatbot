import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

let openChatBtn, chatContainer, chatMessages, userInput;
let genAI, model;
let systemInstruction = "";
let apiKeys = [];
let currentKeyIndex = 0;
let chatHistory = [];
let totalUsedTokens = 0;
let apiKeyUsage = {};

// Load instruction file
async function loadInstructions() {
  const res = await fetch("instructions.txt");
  systemInstruction = await res.text();
}

// Load API keys from JSON
async function loadAPIKeys() {
  const res = await fetch("icons.json");
  const data = await res.json();
  apiKeys = data.API_KEYS; 

  // Initialize usage tracking for each key
  apiKeys.forEach((key, index) => {
    apiKeyUsage[index] = {
      count: 0,
      maskedKey: key.substring(0, 10) + "..." + key.substring(key.length - 4),
    };
  });

  // Random starting index
  currentKeyIndex = Math.floor(Math.random() * apiKeys.length);
  // console.log(
  //   `Starting with API key #${currentKeyIndex + 1} (${
  //     apiKeyUsage[currentKeyIndex].maskedKey
  //   })`
  // );
}

// Initialize model (first time)
async function initializeModel() {
  try {
    await loadAPIKeys();
    await loadInstructions();
    await createModel(apiKeys[currentKeyIndex]);
    console.log("Chatbot initialized successfully");
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

// Create model using a specific API key (reused for switching)
async function createModel(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = await genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: systemInstruction,
  });
}

//Function to Send Message
async function sendMessage(customText = null) {
  const text = customText || userInput.value.trim();
  if (text === "") return;

  appendMessage("user", text);
  // console.log("User sent:", text);
  userInput.value = "";

  try {
    // Log which API key is being used for this request
    const keyIndexBeforeRequest = currentKeyIndex;
    apiKeyUsage[keyIndexBeforeRequest].count++;
    // console.log(
    //   `\n🔑 Using API Key #${keyIndexBeforeRequest + 1}/${apiKeys.length} (${
    //     apiKeyUsage[keyIndexBeforeRequest].maskedKey
    //   })`
    // );
    // console.log(
    //   `📊 Usage count for this key: ${apiKeyUsage[keyIndexBeforeRequest].count}`
    // );

    // Save user input to history
    chatHistory.push({ role: "user", text: text });

    // Prepare conversation with full memory
    const historyForModel = chatHistory.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.text }],
    }));

    // Get model response using chat session for context
    const chatSession = await model.startChat({ history: historyForModel });
    const result = await chatSession.sendMessage(text);
    const response = result.response.text();

    // Store bot response in memory
    chatHistory.push({ role: "model", text: response });

    // Token usage tracking
    // if (result.response.usageMetadata) {
    //   const inputTokens = result.response.usageMetadata.promptTokenCount || 0;
    //   const outputTokens =
    //     result.response.usageMetadata.candidatesTokenCount || 0;
    //   const totalTokens =
    //     result.response.usageMetadata.totalTokenCount ||
    //     inputTokens + outputTokens;
    //   totalUsedTokens += totalTokens;
    //   console.log("📈 Input Tokens:", inputTokens);
    //   console.log("📈 Output Tokens:", outputTokens);
    //   console.log("📈 Total Tokens (this request):", totalTokens);
    //   console.log("📈 Total Tokens (all requests):", totalUsedTokens);
    // }

    appendMessage("bot", response || "Sorry, I couldn't understand.");
    // console.log("🤖 Bot's Reply:", response.substring(0, 100) + "...");

    // Log API key usage summary
    // console.log("\n📋 API Key Usage Summary:");
    // Object.keys(apiKeyUsage).forEach((index) => {
    //   // console.log(
    //   //   `   Key #${parseInt(index) + 1}: ${
    //   //     apiKeyUsage[index].count
    //   //   } requests (${apiKeyUsage[index].maskedKey})`
    //   // );
    // });

    // Switch to the next API key for next query
    if (apiKeys.length > 1) {
      const previousKeyIndex = currentKeyIndex;
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      await createModel(apiKeys[currentKeyIndex]);
      // console.log(
      //   `\n🔄 Switched from Key #${previousKeyIndex + 1} to Key #${
      //     currentKeyIndex + 1
      //   } (${apiKeyUsage[currentKeyIndex].maskedKey})`
      // );
    }
  } catch (error) {
    console.error(
      "❌ Error occurred with API Key #" + (currentKeyIndex + 1) + ":",
      error
    );

    if (
      error.message.includes("429") ||
      error.toString().includes("rate") ||
      error.toString().toLowerCase().includes("too many requests")
    ) {
      appendMessage(
        "bot",
        "Too many requests to RMKCET BOT. Please try again after some time."
      );
      console.warn(`⚠️ Rate limit reached on API Key`);
      // For Testing Purposes Only:
      //  #${currentKeyIndex + 1} (${
      //   apiKeyUsage[currentKeyIndex].maskedKey
      // }). Switching to next key...

      // Switch to next API key on rate limit
      if (apiKeys.length > 1) {
        const failedKeyIndex = currentKeyIndex;
        currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
        await createModel(apiKeys[currentKeyIndex]);
        // console.log(
        //   `🔄 Switched from Key #${failedKeyIndex + 1} to Key #${
        //     currentKeyIndex + 1
        //   } due to rate limit`
        // );
      }
    } else {
      appendMessage("bot", "Something went wrong. Please try again later.");
    }
  }
}

//Function to Append Message
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;

  if (sender === "bot") {
    // Step 1: Convert Markdown or raw links to clickable "Click here"
    const urlRegex = /\[.*?\]\((.*?)\)|https?:\/\/[^\s)]+/g;
    let processedText = text.replace(urlRegex, (match, group1) => {
      const url = group1 || match;
      return `<a href="${url}" target="_blank" style="color: #005577; text-decoration: underline;">Click here\n</a>`;
    });

    // Step 2: Remove Markdown bullets/stars and stray symbols
    processedText = processedText
      .replace(/\*\*|[*•]/g, "") // remove bold markers and bullets
      .replace(/^\s*\[|\[\s*/g, "") // remove stray opening brackets
      .replace(/\s*\]$/, ""); // remove stray closing brackets at the end

    msg.innerHTML = processedText.trim();
  } else {
    msg.innerText = text;
  }

  chatMessages.appendChild(msg);
  msg.scrollIntoView({ behavior: "smooth" });
}

// Detect if device is mobile/touch
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia("(max-width: 480px)").matches)
  );
}

// Initialize DOM elements and event listeners when page loads
function initializeChatbot() {
  openChatBtn = document.getElementById("openChatBtn");
  chatContainer = document.getElementById("chatContainer");
  chatMessages = document.getElementById("chatMessages");
  userInput = document.getElementById("userInput");

  if (!openChatBtn || !chatContainer || !chatMessages || !userInput) {
    console.error("Chatbot elements not found!");
    return;
  }

  const isMobile = isMobileDevice();

  // Store expanded state on the button element for persistence
  if (isMobile) {
    // Mobile: Two-step interaction
    // Step 1: First click expands button to show "How can I help you?"
    // Step 2: Second click opens the chatbot
    openChatBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const isExpanded = openChatBtn.classList.contains("mobile-expanded");

      if (!isExpanded) {
        // First click: Expand button
        openChatBtn.classList.add("mobile-expanded");
        // console.log(
        //   "Button expanded on mobile - showing 'How can I help you?'"
        // );
      } else {
        // Second click: Open chatbot
        openChatBtn.style.display = "none";
        chatContainer.style.display = "flex";
        openChatBtn.classList.remove("mobile-expanded");
        // console.log("Chatbot Opened");
      }
    });

    // Click outside to collapse expanded button on mobile
    document.addEventListener("click", function (event) {
      const isClickInsideChat = chatContainer.contains(event.target);
      const isClickOnButton = openChatBtn.contains(event.target);
      const isButtonExpanded =
        openChatBtn.classList.contains("mobile-expanded");

      // If button is expanded and user clicks outside, collapse it
      if (
        isButtonExpanded &&
        !isClickOnButton &&
        !isClickInsideChat &&
        chatContainer.style.display !== "flex"
      ) {
        openChatBtn.classList.remove("mobile-expanded");
        // console.log("Button collapsed on mobile");
      }

      // Close chatbot if open and clicked outside
      if (
        !isClickInsideChat &&
        !isClickOnButton &&
        chatContainer.style.display === "flex"
      ) {
        chatContainer.classList.add("fade-out");
        chatContainer.addEventListener(
          "animationend",
          () => {
            chatContainer.style.display = "none";
            chatContainer.classList.remove("fade-out");
            openChatBtn.style.display = "flex";
            openChatBtn.classList.remove("mobile-expanded");
          },
          { once: true }
        );
      }
    });
  } else {
    // Desktop/Laptop: Direct click opens chatbot (hover shows intro message)
    openChatBtn.addEventListener("click", () => {
      openChatBtn.style.display = "none";
      chatContainer.style.display = "flex";
      // console.log("Chatbot Opened");
    });

    //Click Outside the container to close the Chatbot
    document.addEventListener("click", function (event) {
      const isClickInsideChat = chatContainer.contains(event.target);
      const isClickOnButton = openChatBtn.contains(event.target);

      if (
        !isClickInsideChat &&
        !isClickOnButton &&
        chatContainer.style.display === "flex"
      ) {
        chatContainer.classList.add("fade-out");
        chatContainer.addEventListener(
          "animationend",
          () => {
            chatContainer.style.display = "none";
            chatContainer.classList.remove("fade-out");
            openChatBtn.style.display = "flex";
          },
          { once: true }
        );
      }
    });
  }

  //Enter to send message
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

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
  if (id === "departments") {
    messageDiv.innerText = "📚 Here are the departments in RMKCET👇";
  } else if (id === "materials") {
    messageDiv.innerText =
      "📁 You can directly go to your department's digital notes page from below 👇\n\nOr type below to get your Specific Department Notes.:\n- 'I need digital notes for [Exact-Subject-name] (or) [Subject-code] with [Department-name]'\n- 'Ex: Give me unit 1 notes for Computer Networks from CSE Department'";
  } else if (id === "coe") {
    messageDiv.innerText =
      "Here are the list of Centre of Excellence in RMKCET 👇";
  } else if (id === "placements") {
    messageDiv.innerText = "Here are the department-wise placement details 👇";
  }
  chatMessages.appendChild(messageDiv);
  messageDiv.scrollIntoView({ behavior: "smooth", block: "start" });

  // Define link data
  let items = [];

  if (id === "departments") {
    items = [
      { name: "CSE", url: "https://www.rmkcet.ac.in/cse-department.php" },
      { name: "ECE", url: "https://www.rmkcet.ac.in/ece-department.php" },
      { name: "AIDS", url: "https://www.rmkcet.ac.in/ads-department.php" },
      {
        name: "CSE(CS)",
        url: "https://www.rmkcet.ac.in/cybersecurity-department.php",
      },
      { name: "S&H", url: "https://www.rmkcet.ac.in/sh-department.php" },
      { name: "VLSI", url: "https://www.rmkcet.ac.in/vlsi-department.php" },
    ];
  }

  if (id === "materials") {
    items = [
      { name: "CSE", url: "https://rmkcet.ac.in/cse-student-resources.php" },
      { name: "ECE", url: "https://rmkcet.ac.in/ece-resources.php" },
      { name: "AIDS", url: "https://rmkcet.ac.in/aids-resources.php" },
      { name: "CSE(CS)", url: "https://rmkcet.ac.in/cyber-resources.php" },
      { name: "S&H", url: "https://rmkcet.ac.in/sh-student-resources.php" },
      { name: "VLSI", url: "https://rmkcet.ac.in/vlsi-resources.php" },
    ];
  }

  if (id === "coe") {
    items = [
      {
        name: "Artificial Intelligence",
        url: "https://rmkcet.ac.in/artificial-intelligence-coe.php",
      },
      { name: "Cloud Computing", url: "https://rmkcet.ac.in/cloud-coe.php" },
      {
        name: "Cyber Security",
        url: "https://rmkcet.ac.in/information-security-coe.php",
      },
      {
        name: "Full Stack Technology",
        url: "https://rmkcet.ac.in/full-stack-technology-coe.php",
      },
      {
        name: "Automotive Electronics",
        url: "https://rmkcet.ac.in/automotive-electronics-coe.php",
      },
      {
        name: "Factory Automation",
        url: "https://rmkcet.ac.in/factory-automation-coe.php",
      },
      { name: "Internet of Things", url: "https://rmkcet.ac.in/iot_coe.php" },
      {
        name: "Robotics Process Automation",
        url: "https://rmkcet.ac.in/automotiveR&D-coe.php",
      },
      { name: "Telecom", url: "https://rmkcet.ac.in/telecom-coe.php" },
      { name: "VLSI", url: "https://rmkcet.ac.in/embeded-systems-coe.php" },
    ];
  }

  if (id === "placements") {
    items = [
      { name: "CSE", url: "https://www.rmkcet.ac.in/cse-placement.php" },
      { name: "ECE", url: "https://www.rmkcet.ac.in/ece-placement.php" },
      { name: "AIDS", url: "https://www.rmkcet.ac.in/ads-placements.php" },
      { name: "CSE(CS)", url: "https://www.rmkcet.ac.in/cyber-placements.php" },
    ];
  }

  // Create and append <a> elements with class "defaultInput"
  items.forEach((item) => {
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

// Function to display API key usage statistics (can be called from browser console)
// window.getAPIKeyStats = function () {
//   console.log("\n📊 === API Key Usage Statistics ===");
//   console.log(`Total API Keys: ${apiKeys.length}`);
//   console.log(`Current API Key: #${currentKeyIndex + 1}`);
//   console.log(`Total Tokens Used: ${totalUsedTokens}`);
//   console.log("\n📋 Usage by Key:");
//   Object.keys(apiKeyUsage).forEach((index) => {
//     const usage = apiKeyUsage[index];
//     const isCurrent =
//       parseInt(index) === currentKeyIndex ? " ⭐ (CURRENT)" : "";
//     console.log(
//       `   Key #${parseInt(index) + 1}: ${usage.count} requests${isCurrent}`
//     );
//     console.log(`      Masked: ${usage.maskedKey}`);
//   });
//   console.log("================================\n");
//   return apiKeyUsage;
// };

// Initialize when the page loads
window.addEventListener("DOMContentLoaded", async () => {
  // Initialize DOM elements and event listeners
  initializeChatbot();

  // Initialize AI model
  await initializeModel();

  // Set up button event listeners
  document
    .getElementById("send")
    ?.addEventListener("click", () => sendMessage());
  document
    .getElementById("departments")
    ?.addEventListener("click", () => initialOptions("departments"));
  document
    .getElementById("materials")
    ?.addEventListener("click", () => initialOptions("materials"));
  document
    .getElementById("coe")
    ?.addEventListener("click", () => initialOptions("coe"));
  document
    .getElementById("placements")
    ?.addEventListener("click", () => initialOptions("placements"));

  console.log("Chatbot Initialized");
  // console.log(
  //   "💡 Tip: Type 'getAPIKeyStats()' in the console to see API key usage statistics"
  // );
});
