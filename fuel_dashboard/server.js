const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
const PORT = 3001;


const GEMINI_API_KEY = "AIzaSyAYkUWKZ2q3bKa4-FsV1odNe91uO1dlfIM"; 


const MODEL_NAME = "gemini-2.5-flash"; 

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { system, messages } = req.body;

    // 1. Convert to Gemini format and filter empty messages
    let geminiMessages = messages
      .filter(m => m.content && m.content.trim() !== '')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // 2. Ensure conversation starts with 'user'
    while (geminiMessages.length > 0 && geminiMessages[0].role === 'model') {
      geminiMessages.shift();
    }

    if (geminiMessages.length === 0) {
      geminiMessages = [{ role: 'user', parts: [{ text: 'Hello' }] }];
    }

    // 3. Merge consecutive same-role messages (Gemini requirement)
    const fixed = [];
    for (const curr of geminiMessages) {
      if (fixed.length > 0 && fixed[fixed.length - 1].role === curr.role) {
        fixed[fixed.length - 1].parts[0].text += '\n' + curr.parts[0].text;
      } else {
        fixed.push(curr);
      }
    }

    console.log(`Calling ${MODEL_NAME}...`);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: system || "You are a helpful assistant." }]
          },
          contents: fixed,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000, // Increased slightly for your research analysis
          }
        }),
      }
    );

    const data = await response.json();

    // 4. Handle Rate Limiting (Error 429) or other API errors
    if (response.status === 429) {
      console.error("Quota Exceeded: You are sending requests too fast or your key is being used elsewhere.");
      return res.status(429).json({ 
        content: [{ text: "Error: Daily limit reached or too many requests per minute. Please check your AI Studio dashboard." }] 
      });
    }

    if (data.error) {
      console.error("Gemini API Error:", data.error.message);
      return res.status(response.status).json({
        content: [{ text: `Gemini Error: ${data.error.message}` }]
      });
    }

    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      ?? "Empty response from AI. Please try a different prompt.";

    res.json({ content: [{ text: replyText }] });

  } catch (err) {
    console.error('Proxy server crash:', err.message);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`--------------------------------------------------`);
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Model: ${MODEL_NAME}`);
  console.log(`Keep an eye on your AI Studio quota if you see 429 errors.`);
  console.log(`--------------------------------------------------`);
});