const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();
const PORT = process.env.PORT || 5001;

// Proxy for AngularJS app
app.use(
  "/",
  createProxyMiddleware({
    target: "http://localhost:4200", // URL of the AngularJS app
    changeOrigin: true,
    pathRewrite: {
      "^/": "/", // Rewrite URL path if necessary
    },
  })
);

// Proxy for Next.js app
app.use(
  "/n1",
  createProxyMiddleware({
    target: "https://angular-nextjs-poc.vercel.app",
    changeOrigin: true,
    pathRewrite: {
      "^/n1": "/n1", // Rewrite URL path if necessary
    },
  })
);

// Proxy for Next.js static assets
app.use(
  "/_next",
  createProxyMiddleware({
    target: "https://angular-nextjs-poc.vercel.app",
    changeOrigin: true,
    pathRewrite: {
      "^/_next": "/_next", // Rewrite URL path if necessary
    },
  })
);

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
