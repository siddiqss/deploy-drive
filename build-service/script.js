const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const Redis = require("ioredis");
const dotenv = require("dotenv");
dotenv.config();

const redisUri = process.env.REDIS_URI;
const publisher = new Redis(redisUri);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;
const BUILD_COMMAND = process.env.BUILD_COMMAND || "npm run build";
const SUBDIRECTORY = process.env.SUBDIRECTORY;
const OUTPUT_DIRECTORY = process.env.OUTPUT_DIRECTORY || "dist";
const INSTALL_COMMAND = process.env.INSTALL_COMMAND || "npm install";

function publishLog(log) {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}

async function init() {
  console.log("Executing script.js");
  publishLog("Build Started...");

  const outDirPath =
    SUBDIRECTORY === undefined
      ? path.join(__dirname, "output")
      : path.join(__dirname, "output", SUBDIRECTORY);

  const p = exec(`cd ${outDirPath} && ${INSTALL_COMMAND} && ${BUILD_COMMAND}`);

  p.stdout.on("data", function (data) {
    console.log(data.toString());
    publishLog(data.toString());
  });

  p.stdout.on("error", function (data) {
    console.log("Error", data.toString());
    publishLog(`error: ${data.toString()}`);
  });

  p.on("close", async function () {
    console.log("Build Complete");
    publishLog(`Build Complete`);

    const distFolderPath =
      SUBDIRECTORY === undefined
        ? path.join(__dirname, "output", OUTPUT_DIRECTORY)
        : path.join(__dirname, "output", SUBDIRECTORY, OUTPUT_DIRECTORY);

    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);
      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log("uploading", filePath);
      publishLog(`uploading ${file}`);

      const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await s3Client.send(command);
      publishLog(`uploaded ${file}`);
      console.log("uploaded", filePath);
    }
    console.log("Done...");
    publishLog(`Done`);
  });
}

init();
