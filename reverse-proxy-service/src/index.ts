import express from "express";
import { createProxy } from "http-proxy";
import dotenv from "dotenv";
dotenv.config()

const app = express();
const PORT = 8000;

const BASE_PATH = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/__outputs/`;

const proxy = createProxy();

app.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];

  // DB Query

  const resolvesTo = `${BASE_PATH}/${subdomain}`;

  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  if (url === "/") proxyReq.path += "index.html";
});

app.listen(PORT, () => console.log("Running reverse proxy at: ", PORT));
