import express from "express";
import cors from "cors";
import path from "path";

import { simpleGit } from "simple-git";
import generateId from "./utils/generateId";
import getAllFiles from "./utils/getAllFiles";
import {
  getStatusFromDB,
  sendMessageToQueue,
  updateStatusInDB,
  uploadFile,
} from "./utils/aws";

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 8000;

app.post("/upload", async (req, res) => {
  const id = generateId();

  const repoUrl = req.body.repoUrl;
  const projectName = req.body.projectName;
  const subDirectory = req.body.subDirectory;
  const buildCommand = req.body.buildCommand;
  const outputDirectory = req.body.outputDirectory;

  await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));
  const files = getAllFiles(path.join(__dirname, `output/${id}`));

  files.forEach(async (file) => {
    // upload-service/dist/output/sqwe12/
    // 8 represents length of string "/output/" in the path
    await uploadFile(file.slice(__dirname.length + 8), file);
  });


  // wait for 5 seconds to upload the files to S3
  await new Promise((resolve)=>setTimeout(resolve, 5000));

  console.log("uploaded files to S3")
  await sendMessageToQueue(id, subDirectory, buildCommand, outputDirectory);
  console.log("sent message to queue")
  await updateStatusInDB(id, projectName);
  console.log("updated status")

  res.json({
    id,
  });
});

app.get("/status", async (req, res) => {
  const id = req.query.id;
  const status = await getStatusFromDB(String(id));
  res.json(status);
});

app.listen(port, () => {
  console.log(`Server is running at port: `, port);
});
