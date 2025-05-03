// File: server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

app.use(cors());

app.get("/m3u", async (req, res) => {
  const url = req.query.url;
  
  // Allow both http and https URLs
  if (!url || !(url.startsWith("http://") || url.startsWith("https://"))) {
    return res.status(400).send("URL invalid sau lipsa.");
  }
  
  try {
    // Add more comprehensive headers
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
      },
      timeout: 15000 // Add timeout of 15 seconds
    });
    
    if (!response.ok) {
      console.error(`Fetch error: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(`Eroare la fetch: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.text();
    res.set("Content-Type", "application/x-mpegURL");
    res.send(data);
  } catch (err) {
    console.error("Error details:", err.message);
    res.status(500).send(`Eroare la descarcare: ${err.message}`);
  }
});

// Add a simple health check endpoint
app.get("/", (req, res) => {
  res.send("M3U Proxy Server is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Proxy activ pe portul " + PORT));
