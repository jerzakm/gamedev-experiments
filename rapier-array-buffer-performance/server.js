const express = require("express");
const { createServer: createViteServer } = require("vite");

async function createServer() {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.setHeader("Cross-origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-origin-Opener-Policy", "same-origin");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Create Vite server in middleware mode.
  const vite = await createViteServer({
    server: { middlewareMode: "html" },
  });
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.use("*", async (req, res) => {
    // If `middlewareMode` is `'ssr'`, should serve `index.html` here.
    // If `middlewareMode` is `'html'`, there is no need to serve `index.html`
    // because Vite will do that.
  });

  app.listen(3000);
}

createServer();
