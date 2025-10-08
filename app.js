const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const { fetchGeminiQuote } = require('./gemini');

if (typeof fetch === "undefined") {
  global.fetch = require("node-fetch");
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 10000;

// CORS middleware (dynamic)
const allowedOrigins = (process.env.CORS_ALLOW_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const corsMiddleware = cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      async function fetchWithTimeout(resource, options) {
        const { timeout = 5000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(id);
        return response;
      }

      // Handle /api/quote
      if (pathname === "/api/quote") {
        corsMiddleware(req, res, async () => {
          try {
            let prompt = "Give me one short motivational quote."; // Default prompt
            if (req.method === "POST") {
              // Parse POST body
              let body = "";
              req.on("data", (chunk) => {
                body += chunk.toString();
              });
              await new Promise((resolve) => req.on("end", resolve));
              try {
                const parsedBody = JSON.parse(body || "{}");
                if (parsedBody.prompt && typeof parsedBody.prompt === "string") {
                  prompt = parsedBody.prompt.trim();
                }
              } catch (parseErr) {
                console.error("Failed to parse request body:", parseErr);
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: true,
                    message: "Invalid JSON in request body",
                  })
                );
                return;
              }
            }

            // Validate prompt
            if (!prompt) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: true,
                  message: "Prompt cannot be empty",
                })
              );
              return;
            }

            // Use fallback-capable helper (Gemini first, then OpenRouter)
            const origin = req.headers['origin'] || process.env.NEXT_PUBLIC_SITE_URL || undefined;
            const result = await fetchGeminiQuote(prompt, { referer: origin, title: process.env.OPENROUTER_TITLE });
            if (result?.error) {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: true, message: "All providers failed", details: result }));
              return;
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ quote: result?.quote || "Stay motivated! (fallback)" }));
          } catch (err) {
            console.error("Quote request failed:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                error: true,
                message: "Server error while generating quote",
                details: err.message,
              })
            );
          }
        });
        return;
      }

      // Serve static files from public/dist
      if (pathname.startsWith('/dist/')) {
        const filePath = path.join(__dirname, 'public', pathname.replace('/dist/', ''));
        try {
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            const content = await fs.readFile(filePath);
            res.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css' : 'application/javascript');
            res.statusCode = 200;
            res.end(content);
            return;
          }
        } catch (e) {
          res.statusCode = 404;
          res.end('File not found');
          return;
        }
      }

      // Handle Next.js routes
      await handle(req, res, parsedUrl);
    } catch (error) {
      console.error('Server error:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(PORT, (err) => {
    if (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('App preparation failed:', err);
  process.exit(1);
});