// File: server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

app.use(cors());

// Special handler for Xtream Codes API
app.get("/m3u", async (req, res) => {
  const url = req.query.url;
  
  if (!url) {
    return res.status(400).send("URL lipsa.");
  }
  
  try {
    // Parse the URL to extract Xtream Codes components
    let parsedUrl = new URL(url);
    let host = parsedUrl.origin;
    let queryParams = {};
    
    // Parse query parameters
    for (const [key, value] of parsedUrl.searchParams.entries()) {
      queryParams[key] = value;
    }
    
    // Specific handling for Xtream Codes format
    if (queryParams.username && queryParams.password && queryParams.type) {
      console.log(`Procesez request Xtream Codes pentru ${host} cu username: ${queryParams.username}`);
      
      // For Xtream Codes API, format is typically:
      // http(s)://domain:port/get.php?username=xxx&password=xxx&type=m3u_plus
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache"
        },
        timeout: 20000 // Increased timeout for IPTV servers
      });
      
      if (!response.ok) {
        console.error(`Fetch error for Xtream Codes: ${response.status} ${response.statusText}`);
        
        // More detailed debugging for 404 errors
        if (response.status === 404) {
          return res.status(404).send(`Server-ul Xtream Codes a returnat 404 Not Found. 
          Verifică dacă URL-ul, username-ul și parola sunt corecte.
          Asigură-te că provider-ul este online și că folosești endpoint-ul corect.`);
        }
        
        return res.status(response.status).send(`Eroare la fetch: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.text();
      console.log("Răspuns primit, lungime:", data.length);
      
      // Verify the response looks like an M3U file
      if (data.trim().startsWith("#EXTM3U")) {
        res.set("Content-Type", "application/x-mpegURL");
        res.send(data);
      } else {
        console.error("Răspunsul nu pare să fie un fișier M3U valid");
        res.status(400).send("Răspunsul nu este un playlist M3U valid");
      }
    } else {
      // Try direct fetch for non-Xtream URLs
      console.log("Nu pare a fi un URL Xtream Codes standard, încerc direct fetch");
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
          "Accept": "*/*"
        }
      });
      
      if (!response.ok) {
        return res.status(response.status).send(`Eroare la fetch: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.text();
      res.set("Content-Type", "application/x-mpegURL");
      res.send(data);
    }
  } catch (err) {
    console.error("Error details:", err.message);
    res.status(500).send(`Eroare la descărcare: ${err.message}`);
  }
});

// Pentru a testa direct un provider Xtream Codes
app.get("/test-xtream", async (req, res) => {
  const { host, port, username, password } = req.query;
  
  if (!host || !username || !password) {
    return res.status(400).send("Lipsesc parametri necesari (host, username, password)");
  }
  
  const protocol = req.query.https === 'true' ? 'https' : 'http';
  const portStr = port ? `:${port}` : '';
  const testUrl = `${protocol}://${host}${portStr}/get.php?username=${username}&password=${password}&type=m3u_plus`;
  
  try {
    const response = await fetch(testUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36"
      },
      timeout: 15000
    });
    
    if (!response.ok) {
      return res.status(response.status).send(`Testare eșuată: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.text();
    if (data.trim().startsWith("#EXTM3U")) {
      res.send(`Test reușit! Server Xtream Codes valid. Lungime playlist: ${data.length} caractere`);
    } else {
      res.status(400).send("Răspunsul primit nu este un playlist M3U valid");
    }
  } catch (err) {
    res.status(500).send(`Eroare la testare: ${err.message}`);
  }
});

// Add a simple health check endpoint
app.get("/", (req, res) => {
  res.send(`
    <html>
    <head>
      <title>M3U Xtream Codes Proxy</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .code { background: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; }
      </style>
    </head>
    <body>
      <h1>M3U Xtream Codes Proxy</h1>
      <p>Server-ul de proxy pentru M3U/Xtream Codes este activ.</p>
      <h2>Cum să folosești:</h2>
      <p>Pentru Xtream Codes, folosește URL-ul în următorul format:</p>
      <div class="code">
        /m3u?url=http://provider.com:8080/get.php?username=USER&password=PASS&type=m3u_plus
      </div>
      <p>Pentru a testa direct un provider Xtream Codes:</p>
      <div class="code">
        /test-xtream?host=provider.com&port=8080&username=USER&password=PASS
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Proxy Xtream Codes activ pe portul " + PORT));
