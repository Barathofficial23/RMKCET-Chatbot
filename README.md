# 🎓 RMKCET Virtual Assistant

[![Status](https://img.shields.io/badge/Status-Live-brightgreen.svg)]()
[![Tech](https://img.shields.io/badge/Tech-JavaScript%20%7C%20Gemini%20AI-blue.svg)]()
[![Institution](https://img.shields.io/badge/Institution-RMKCET-red.svg)](https://rmkcet.ac.in)

An AI-powered virtual assistant designed specifically for **R.M.K. College of Engineering and Technology (RMKCET)**. This assistant streamlines access to academic resources, department details, and placement information through a seamless conversational interface.


## 🚀 Overview

The RMKCET Virtual Assistant is a lightweight, frontend-driven chatbot that leverages the power of **Google Gemini** to provide instant, instruction-based responses. It acts as a digital concierge for students, parents, and visitors.

## ✨ Key Features

* 🤖 **Gemini AI Integration:** Advanced natural language processing for human-like interaction.
* 📚 **Digital Library:** Instant retrieval of unit-wise and subject-wise digital notes.
* 🏫 **Institutional Insights:** Detailed info on Departments, Centres of Excellence (COE), and Placements.
* 🎯 **Smart Recognition:** Supports academic shorthand (e.g., `CN` ➔ `Computer Networks`).
* 🧠 **Chat Memory:** Context-aware conversations that remember previous interactions.
* 🔄 **High Reliability:** Automatic API key rotation to ensure 24/7 uptime.

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **AI Engine** | Google Gemini API |
| **Data Format** | JSON, Text-based Knowledge Base |
| **Architecture** | Client-side (Serverless) |



## 📂 Project Structure

```bash
├── index.html          # Main interface
├── style.css           # Custom styling & animations
├── clgbot.js           # Core Chatbot logic & Gemini integration
├── instructions.txt    # Fine-tuning instructions for the AI
├── notes.txt           # Structured database of digital notes
├── config.json         # API Configuration (Excluded in production)
└── assets/             # Images, logos, and icons
```

## ⚙️ How It Works

* User enters a query in the chatbot interface
* The chatbot checks predefined instructions and available notes
* Relevant responses are generated using the Google Gemini API
* Notes are fetched from notes.txt when applicable
* If information is unavailable, the user is informed gracefully
* Conversation context is preserved across API key rotations

## 🔐 API Key Security Note

⚠️ This project uses frontend-based API integration.

- Do **NOT** expose real API keys in public repositories
- Use placeholder keys for public sharing
- Add `config.json` to `.gitignore` to prevent accidental commits

Example `.gitignore` entry:

```gitignore
config.json
```

## 🌐 Deployment

The chatbot is deployed and actively used within RMKCET’s digital platform, enhancing information accessibility for students and visitors.
[RMKCET Website](https://www.rmkcet.ac.in)

## 📈 Future Enhancements

🔐 Backend proxy for secure API handling

🗄️ Database-backed chat memory

🌍 Multilingual support

📊 Admin dashboard for analytics

📱 Mobile-first UI improvements

## 👨‍💻 Author

Barath A S  
Developed for R.M.K. College of Engineering and Technology (RMKCET)
