#!/usr/bin/env node
/**
 * Preview bridge: expose the dev server on the sandbox's public work ports.
 *
 * The app must listen on `0.0.0.0:8080` (see AGENTS.md §1 — the preview proxy is
 * documented as preferring that binding, and `vite.config.ts` pins it with
 * `strictPort`). The sandbox in this workspace forwards its two public hosts to
 * ports 12000 and 12001 instead, so without this bridge the preview URLs answer
 * `502 Bad Gateway` even though the dev server is perfectly healthy.
 *
 * This listens on those two ports and forwards to `127.0.0.1:8080`, leaving the
 * Vite contract untouched. `Host` is rewritten to `localhost:8080` because Vite
 * rejects requests for hosts it does not recognise; the original host travels in
 * `x-forwarded-host` / `x-forwarded-proto`, which the app's auth-popup
 * middleware already reads.
 */
import http from "node:http";
import net from "node:net";

const UPSTREAM = { host: "127.0.0.1", port: 8080 };
const BRIDGE_PORTS = [12000, 12001];

function upstreamHeaders(headers) {
  const next = { ...headers, host: `${UPSTREAM.host}:${UPSTREAM.port}` };
  next["x-forwarded-host"] = headers.host ?? "";
  next["x-forwarded-proto"] = "https";
  return next;
}

function forward(req, res) {
  const proxyReq = http.request(
    { host: UPSTREAM.host, port: UPSTREAM.port, method: req.method, path: req.url, headers: upstreamHeaders(req.headers) },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("preview bridge: dev server on 8080 is not responding");
  });
  req.pipe(proxyReq);
}

/** Vite's HMR channel is a WebSocket, so upgrades need forwarding too. */
function forwardUpgrade(req, socket, head) {
  const upstream = net.connect(UPSTREAM.port, UPSTREAM.host, () => {
    const headers = upstreamHeaders(req.headers);
    let raw = `${req.method} ${req.url} HTTP/1.1\r\n`;
    for (const [key, value] of Object.entries(headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const v of value) raw += `${key}: ${v}\r\n`;
      else raw += `${key}: ${value}\r\n`;
    }
    upstream.write(`${raw}\r\n`);
    if (head?.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
}

let listening = 0;
for (const port of BRIDGE_PORTS) {
  const server = http.createServer(forward);
  server.on("upgrade", forwardUpgrade);
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`[preview-bridge] port ${port} already in use — skipping`);
      return;
    }
    console.error(`[preview-bridge] port ${port} failed:`, err.message);
  });
  server.listen(port, "0.0.0.0", () => {
    listening += 1;
    console.log(`[preview-bridge] ${port} -> ${UPSTREAM.host}:${UPSTREAM.port}`);
    if (listening === BRIDGE_PORTS.length) {
      console.log("[preview-bridge] public preview ports are up");
    }
  });
}
