// File: server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

app.use(cors());

app.get("/m3u", async (req, res) => {
  const url = req.query.url;

  if (!url || !url.startsWith("http://")) {
    return res.status(400).send("URL invalid sau lipsa.");
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) {
      return res.status(response.status).send("Eroare la fetch");
    }

    const data = await response.text();
    res.set("Content-Type", "application/x-mpegURL");
    res.send(data);
  } catch (err) {
    res.status(500).send("Eroare la descarcare.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Proxy activ pe portul " + PORT));
