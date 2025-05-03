// File: server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const app = express();

app.use(cors());

// Colecție de User-Agents pentru playere media comune
const mediaPlayerUserAgents = {
  vlc: [
    "VLC/3.0.18 LibVLC/3.0.18",
    "VLC/3.0.16 LibVLC/3.0.16",
    "VLC/3.0.11 LibVLC/3.0.11",
    "VLC/3.0.8 LibVLC/3.0.8"
  ],
  kodi: [
    "Kodi/20.0 (Windows; 10.0; x86_64)",
    "Kodi/19.4 (Linux; Android TV; x86_64)",
    "Kodi/19.1 (Windows; 10.0; x86_64)"
  ],
  appletv: [
    "AppleCoreMedia/1.0.0.19G82 (Apple TV; U; CPU OS 15_6 like Mac OS X; en_us)",
    "AppleCoreMedia/1.0.0.20D91 (Apple TV; U; CPU OS 16_3 like Mac OS X; en_us)"
  ],
  ffmpeg: [
    "Lavf/58.12.100",
    "Lavf/58.29.100",
    "Lavf/58.45.100"
  ],
  smarters: [
    "IPTVSmarters/1.0",
    "IPTVSmarters Pro/2.0",
    "IPTVSmarters/3.0 Android"
  ],
  exoplayer: [
    "ExoPlayerLib/2.13.2",
    "ExoPlayerLib/2.14.0",
    "ExoPlayerLib/2.15.1"
  ],
  browser: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15"
  ],
  gse: [
    "GSE/1.0 CFNetwork/1120 Darwin/19.0.0",
    "GSE/2.0 CFNetwork/1209 Darwin/20.2.0"
  ],
  iptv: [
    "IPTV/5.0",
    "TiviMate/3.0.1",
    "Perfect Player/1.5.5"
  ]
};

// Funcție pentru a obține un User-Agent aleatoriu sau specific
function getMediaPlayerUserAgent(type = "vlc") {
  // Dacă tipul este "random", alege o categorie aleatorie
  if (type === "random") {
    const categories = Object.keys(mediaPlayerUserAgents);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const agents = mediaPlayerUserAgents[randomCategory];
    return agents[Math.floor(Math.random() * agents.length)];
  }
  
  // Verifică dacă tipul specific există
  if (mediaPlayerUserAgents[type]) {
    const agents = mediaPlayerUserAgents[type];
    return agents[Math.floor(Math.random() * agents.length)];
  }
  
  // Implicit întoarce VLC
  return mediaPlayerUserAgents.vlc[0];
}

// Special handler for Xtream Codes API
app.get("/m3u", async (req, res) => {
  const url = req.query.url;
  const playerType = req.query.player || "vlc"; // Implicit VLC
  
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
      console.log(`Procesez request Xtream Codes pentru ${host} cu username: ${queryParams.username}, simulare player: ${playerType}`);
      
      // For Xtream Codes API, format is typically:
      // http(s)://domain:port/get.php?username=xxx&password=xxx&type=m3u_plus
      const response = await fetch(url, {
        headers: {
          "User-Agent": getMediaPlayerUserAgent(playerType),
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Connection": "keep-alive",
          "Cache-Control": "no-cache",
          "X-Playback-Session-Id": `${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`,
          "Referer": host
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

// Colecție de endpoint-uri pentru Xtream Codes
const xtreamEndpoints = [
  "/get.php",
  "/player_api.php",
  "/xmltv.php",
  "/panel_api.php",
  "/live/:username/:password/:channel",
  "/movie/:username/:password/:channel",
  "/series/:username/:password/:channel"
];

// Pentru a testa direct un provider Xtream Codes cu multiple endpoint-uri
app.get("/test-xtream", async (req, res) => {
  const { host, port, username, password } = req.query;
  const playerType = req.query.player || "vlc";
  
  if (!host || !username || !password) {
    return res.status(400).send("Lipsesc parametri necesari (host, username, password)");
  }
  
  const protocol = req.query.https === 'true' ? 'https' : 'http';
  const portStr = port ? `:${port}` : '';
  const baseUrl = `${protocol}://${host}${portStr}`;
  
  let results = [];
  let success = false;
  
  try {
    // Test 1: Încarcă playlist M3U
    const m3uUrl = `${baseUrl}/get.php?username=${username}&password=${password}&type=m3u_plus`;
    
    try {
      const response = await fetch(m3uUrl, {
        headers: {
          "User-Agent": getMediaPlayerUserAgent(playerType),
          "Accept": "*/*",
          "Connection": "keep-alive",
          "X-Playback-Session-Id": `${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`
        },
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.text();
        if (data.trim().startsWith("#EXTM3U")) {
          success = true;
          results.push(`✅ M3U: Playlist încărcat cu succes (${data.length} bytes)`);
          
          // Extras un canal pentru testare
          const channelMatch = data.match(/#EXTINF:-1.*?tvg-id="([^"]*)".*?\n(http.*?)(?:\n|$)/);
          if (channelMatch && channelMatch[2]) {
            results.push(`🔗 Canal de test găsit: ${channelMatch[2]}`);
          }
        } else {
          results.push(`❌ M3U: Răspunsul nu este un playlist M3U valid`);
        }
      } else {
        results.push(`❌ M3U: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      results.push(`❌ M3U: ${err.message}`);
    }
    
    // Test 2: Verifică player_api.php
    const apiUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": getMediaPlayerUserAgent(playerType),
          "Accept": "application/json"
        },
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          success = true;
          results.push(`✅ API: Categorii live disponibile (${data.length} categorii)`);
        } else {
          results.push(`❓ API: Răspuns neașteptat de la API`);
        }
      } else {
        results.push(`❌ API: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      results.push(`❌ API: ${err.message}`);
    }
    
    // Răspuns final
    if (success) {
      const resultHtml = `
        <html>
        <head>
          <title>Test Xtream Codes</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #4CAF50; }
            .result { margin-bottom: 8px; font-family: monospace; }
            .success { color: #4CAF50; }
            .error { color: #F44336; }
            .server-info { background: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Test Xtream Codes Reușit! 🎉</h1>
          
          <div class="server-info">
            <strong>Server:</strong> ${host}${portStr}<br>
            <strong>Protocol:</strong> ${protocol}<br>
            <strong>Username:</strong> ${username}<br>
            <strong>User-Agent:</strong> ${getMediaPlayerUserAgent(playerType)}
          </div>
          
          <h2>Rezultate teste:</h2>
          ${results.map(r => `<div class="result ${r.startsWith('✅') ? 'success' : (r.startsWith('❌') ? 'error' : '')}">${r}</div>`).join('')}
          
          <p>Pentru a folosi acest server cu proxy-ul, utilizează URL-ul:</p>
          <div style="background: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; overflow-x: auto;">
            /m3u?url=${encodeURIComponent(baseUrl)}/get.php?username=${username}&password=${password}&type=m3u_plus&player=${playerType}
          </div>
        </body>
        </html>
      `;
      res.send(resultHtml);
    } else {
      const resultText = `❌ Testare eșuată pentru ${baseUrl}\n\nRezultate:\n${results.join('\n')}`;
      res.status(400).send(resultText);
    }
  } catch (err) {
    res.status(500).send(`❌ Eroare generală la testare: ${err.message}`);
  }
});

// Adaugă o nouă rută pentru streaming direct
app.get("/stream", async (req, res) => {
  const url = req.query.url;
  const playerType = req.query.player || "vlc";
  
  if (!url) {
    return res.status(400).send("URL lipsă.");
  }
  
  try {
    console.log(`Procesez request streaming pentru ${url}, player: ${playerType}`);
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": getMediaPlayerUserAgent(playerType),
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "X-Playback-Session-Id": `${Date.now().toString(16)}${Math.random().toString(16).substr(2, 8)}`
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      return res.status(response.status).send(`Eroare stream: ${response.status} ${response.statusText}`);
    }
    
    // Pipe the stream response directly
    response.body.pipe(res);
    
    response.body.on('error', (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).send("Eroare în timpul streamingului");
      }
    });
  } catch (err) {
    console.error("Stream error details:", err.message);
    res.status(500).send(`Eroare la streaming: ${err.message}`);
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
        .code { background: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; overflow-x: auto; }
        .player-option { margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>M3U Xtream Codes Proxy</h1>
      <p>Server-ul de proxy pentru M3U/Xtream Codes este activ.</p>
      
      <h2>Cum să folosești:</h2>
      <p>Pentru Xtream Codes, folosește URL-ul în următorul format:</p>
      <div class="code">
        /m3u?url=http://provider.com:8080/get.php?username=USER&password=PASS&type=m3u_plus&player=vlc
      </div>
      
      <p>Pentru a testa direct un provider Xtream Codes:</p>
      <div class="code">
        /test-xtream?host=provider.com&port=8080&username=USER&password=PASS
      </div>
      
      <p>Pentru streaming direct (opțiune nouă):</p>
      <div class="code">
        /stream?url=http://provider.com:8080/stream/channelid.ts&player=vlc
      </div>
      
      <h2>Opțiuni de simulare player:</h2>
      <p>Poți specifica tipul de player media folosit pentru request adăugând <code>&player=XXX</code> la URL:</p>
      <div class="player-option"><strong>vlc</strong> - Simulează VLC Player (implicit)</div>
      <div class="player-option"><strong>appletv</strong> - Simulează Apple TV</div>
      <div class="player-option"><strong>smarters</strong> - Simulează IPTV Smarters</div>
      <div class="player-option"><strong>exoplayer</strong> - Simulează ExoPlayer</div>
      <div class="player-option"><strong>random</strong> - Alege aleatoriu un User-Agent</div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Proxy Xtream Codes activ pe portul " + PORT));
