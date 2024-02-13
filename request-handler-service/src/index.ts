import { S3 } from "aws-sdk";
import express from "express";
const dotenv = require("dotenv");
dotenv.config();

const PORT = 3001;
const app = express();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

app.get("/*", async (req, res) => {
  const host = req.hostname;
  const id = host.split(".")[0];
  const filePath = req.path;
  const contents = await s3
    .getObject({
      Bucket: process.env.S3_BUCKET!,
      Key: `dist/${id}${filePath}`,
    })
    .promise();

  const type = filePath.endsWith("html")
    ? "text/html"
    : filePath.endsWith("css")
    ? "text/css"
    : "application/javascript";
  res.set("Content-Type", type);

  res.send(contents.Body);
});

app.listen(PORT, () => {
  {
    console.log("request handler running on port: ", PORT);
  }
});
