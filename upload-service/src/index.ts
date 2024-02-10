import express from "express";
import cors from "cors";
import path from "path";

import { simpleGit } from "simple-git";
import generateId from "./utils/generateId";
import getAllFiles from "./utils/getAllFiles";
import { sendMessageToQueue, uploadFile } from "./utils/aws";

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 8000;

app.post("/deploy", async (req, res) => {
  const id = generateId();

  const repoUrl = req.body.repoUrl;
  console.log(repoUrl);

  await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`));
  const files = getAllFiles(path.join(__dirname, `output/${id}`));
  files.forEach(async (file) => {
    // upload-service/dist/output/sqwe12/
    // 8 represents length of string "/output/" in the path
    await uploadFile(file.slice(__dirname.length + 8), file);
  });

  await sendMessageToQueue(id);
  
  res.json({
    id,
  });
});

app.listen(port, () => {
  console.log(`Server is running at port: `, port);
});
