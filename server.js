import express from 'express';
import cors from 'cors';
import Bytez from 'bytez.js';
import fs from 'fs/promises';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let apiKey = "";

// Load API key
async function loadAPIKey() {
    try {
        const data = await fs.readFile('api-key.json', 'utf8');
        const json = JSON.parse(data);
        apiKey = json.API_KEY ? json.API_KEY.trim() : "";
        if (!apiKey) {
             console.error("API Key not found in api-key.json");
        } else {
             console.log(`API Key loaded: ${apiKey.substring(0, 5)}...`);
        }
    } catch (err) {
        console.error("Error reading api-key.json:", err);
    }
}

loadAPIKey();

app.post('/chat', async (req, res) => {
    try {
        if (!apiKey) {
            await loadAPIKey();
            if (!apiKey) {
                return res.status(500).json({ error: "Server missing API Key" });
            }
        }

        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid messages format" });
        }

        const sdk = new Bytez(apiKey);
        const model = sdk.model("openai/gpt-4.1-nano");

        const { error, output } = await model.run(messages);

        if (error) {
            console.error("Bytez API Error:", error);
            return res.status(500).json({ error: error });
        }

        res.json({ output });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
