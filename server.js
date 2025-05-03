// File: server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

app.use(cors());

app.get("/m3u", async (req, res) => {
  const url = req.query.url;

  // Verificare URL (acceptă și HTTPS)
  if (!url || !(url.startsWith("http://") || url.startsWith("https://"))) {
    return res.status(400).json({ 
      error: "URL invalid sau lipsă. Folosește http:// sau https://." 
    });
  }

  try {
    // Configurare fetch cu headere de player real (VLC) și timeout
    const response = await fetch(url, {
      headers: {
        "User-Agent": "VLC/3.0.16 LibVLC/3.0.16", // Mimică cereri VLC
        "Accept": "*/*",
        "Referer": "https://www.google.com/", // Evită blocarea ca bot
      },
      redirect: 'follow', // Urmează redirectări
      timeout: 10000, // 10 secunde timeout
    });

    if (!response.ok) {
      console.error(`Eroare la fetch: ${response.status} ${response.statusText}`);
      return res.status(502).json({ 
        error: `Eroare la conectare la sursă (${response.status} ${response.statusText})`,
      });
    }

    const data = await response.text();

    // Verifică dacă răspunsul este un fișier M3U valid (opțional)
    if (!data.includes("#EXTM3U")) {
      console.warn("Răspunsul nu pare a fi un fișier M3U valid.");
      // Trimite totuși datele, dar cu un avertisment
      res.set("Content-Type", "text/plain");
      return res.send(data);
    }

    // Răspuns succes
    res.set("Content-Type", "application/x-mpegURL");
    res.send(data);

  } catch (err) {
    console.error("Eroare detaliată:", err);

    // Mesaje personalizate pentru diferite tipuri de erori
    let errorMessage = "Eroare la descărcare";
    if (err.name === "AbortError") {
      errorMessage = "Timeout: Serverul M3U nu a răspuns în 10 secunde.";
    } else if (err.code === "ECONNREFUSED") {
      errorMessage = "Conexiune refuzată (serverul țintă poate fi down).";
    }

    res.status(500).json({ 
      error: errorMessage,
      details: err.message 
    });
  }
});

// Portul este setat din variabila de mediu (Render folosește 10000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy activ pe portul ${PORT}`));
