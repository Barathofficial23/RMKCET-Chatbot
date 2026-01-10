let openChatBtn, chatContainer, chatMessages, userInput;
let systemInstruction = "";
let chatHistory = [];

// Load instruction file
async function loadInstructions() {
  const res = await fetch("instructions.txt");
  systemInstruction = await res.text();
}

//Function to Send Message
async function sendMessage(customText = null) {
  const text = customText || userInput.value.trim();
  if (text === "") return;

  appendMessage("user", text);
  userInput.value = "";

  try {
    // Save user input to history
    chatHistory.push({ role: "user", text: text });

    // Prepare conversation with full memory for Bytez.js
    // Format: system message + conversation history
    const messages = [
      {
        role: "system",
        content:systemInstruction 
      }
    ];

    // Convert chat history to Bytez.js format
    chatHistory.forEach((entry) => {
      if (entry.role === "user") {
        messages.push({
          role: "user",
          content: entry.text,
        });
      } else if (entry.role === "model") {
        messages.push({
          role: "assistant",
          content: entry.text,
        });
      }
    });

    // Get model response from backend
    const responseReq = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
    });

    const responseData = await responseReq.json();

    if (!responseReq.ok) {
        throw new Error(responseData.error || `Server error: ${responseReq.status}`);
    }

    const { output, error } = responseData;

    if (error) {
      throw new Error(error);
    }

    // Extract response from output
    // Bytez.js returns: {error: null, output: {role: 'assistant', content: '...'}, provider: {...}}
    let response = null;

    if (output) {
      // Check if output has content field
      if (output.content && typeof output.content === "string") {
        response = output.content;
      } else if (typeof output === "string") {
        response = output;
      } else {
        // If output is an object, try to extract text
        response = output.text || output.message || String(output);
      }
    }

    // Fallback if nothing found
    if (!response || typeof response !== "string") {
      console.warn(
        "Could not extract string response, using fallback:",
        output
      );
      response = "Sorry, I couldn't understand.";
    }

    // Final safety check - ensure it's a string
    if (typeof response !== "string") {
      response = String(response);
    }

    // Store bot response in memory
    chatHistory.push({ role: "model", text: response });

    appendMessage("bot", response);
  } catch (error) {
    console.error("❌ Error occurred:", error);

    if (
      error.message.includes("429") ||
      error.toString().includes("rate") ||
      error.toString().toLowerCase().includes("too many requests")
    ) {
      appendMessage(
        "bot",
        "Too many requests to RMKCET BOT. Please try again after some time."
      );
      console.warn("⚠️ Rate limit reached");
    } else {
      appendMessage("bot", "Something went wrong. Please try again later.");
    }
  }
}

//Function to Append Message
function appendMessage(sender, text) {
  // Ensure text is a string
  if (typeof text !== "string") {
    console.warn("appendMessage received non-string:", typeof text, text);
    text = String(text || "");
  }

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
    openChatBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const isExpanded = openChatBtn.classList.contains("mobile-expanded");

      if (!isExpanded) {
        // First click: Expand button
        openChatBtn.classList.add("mobile-expanded");
      } else {
        // Second click: Open chatbot
        openChatBtn.style.display = "none";
        chatContainer.style.display = "flex";
        openChatBtn.classList.remove("mobile-expanded");
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


// Initialize when the page loads
window.addEventListener("DOMContentLoaded", async () => {
  // Initialize DOM elements and event listeners
  initializeChatbot();

  // Initialize AI model
  await loadInstructions();

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
});
