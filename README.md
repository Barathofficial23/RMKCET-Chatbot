🎓 RMKCET Virtual Assistant

An AI-powered virtual assistant developed and deployed for R.M.K. College of Engineering and Technology (RMKCET) to assist students, parents, and visitors with academic and college-related queries.

🚀 Overview

The RMKCET Virtual Assistant provides instant, accurate, and instruction-driven responses related to college information. It enhances accessibility to digital notes, department details, placements, Centres of Excellence, and other institutional resources through a conversational interface.
The chatbot is designed to be lightweight, reliable, and fully frontend-based using modern web technologies.

✨ Key Features

🤖 AI-powered conversational chatbot (Google Gemini)
📚 Digital notes retrieval (unit-wise & subject-wise)
🏫 Department, COE, and placement information
🎯 Smart subject recognition (supports abbreviations like CN → Computer Networks)
🧠 Context-aware conversations with chat memory
🔄 Automatic API key rotation for reliability
📄 Instruction-driven responses using external text files
🌐 Deployed for real-world college usage at RMKCET

🛠️ Tech Stack

Frontend: HTML, CSS, JavaScript
AI Model: Google Gemini API
Architecture: Client-side (no backend)
Configuration: JSON-based API key handling
Data Sources: Text-based instruction & notes files

📂 Project Structure
├── index.html
├── style.css
├── clgbot.js
├── instructions.txt
├── notes.txt
├── config.json   (API keys – not to be committed)
└── assets/

⚙️ How It Works

User enters a query
Chatbot checks instructions and available notes
Relevant responses are generated using Gemini
Notes are fetched from notes.txt when applicable
If data is unavailable, user is informed accordingly
Conversation context is preserved across API key rotations

🔐 API Key Security Note

⚠️ This project uses frontend-based API integration.
Do not expose real API keys in public repositories.
Use placeholder keys or exclude config.json using .gitignore.

🌐 Deployment

The chatbot is deployed and actively used within RMKCET’s digital platform, improving information accessibility for students and visitors.

📈 Future Enhancements

🔐 Backend proxy for secure API handling
🗄️ Database-backed chat memory
🌍 Multilingual support
📊 Admin dashboard for analytics
📱 Mobile-first UI improvements

👨‍💻 Author

Developed by Barath A S 
📍 For R.M.K. College of Engineering and Technology (RMKCET)

📄 License

This project is for educational and institutional use.