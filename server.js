const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

app.use(cors());

app.get("/m3u", async (req, res) => {
  const url = req.query.url;

  if (!url || !(url.startsWith("http://") || url.startsWith("https://"))) {
    return res.status(400).send("URL invalid sau lipsa.");
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "*/*",
        "Connection": "keep-alive"
      },
      redirect: 'follow', // Follow redirects
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Fetch error: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(`Eroare la fetch: ${response.statusText}`);
    }

    const data = await response.text();
    res.set("Content-Type", "application/x-mpegURL");
    res.send(data);
  } catch (err) {
    console.error("Full error:", err);
    res.status(500).send(`Eroare la descarcare: ${err.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Proxy activ pe portul " + PORT));
