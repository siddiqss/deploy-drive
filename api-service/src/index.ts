import { Request, Response } from "express";
import dotenv from "dotenv";
const express = require("express");
const cors = require("cors");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
dotenv.config();

const app = express();
const PORT = 9000;
const REVERSE_PROXY_DOMAIN = "localhost:8000";

const ecsClient = new ECSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const config = {
  CLUSTER: process.env.ECS_CLUSTER_ARN,
  TASK: process.env.ECS_TASK_ARN,
};

app.use(cors());

app.use(express.json());

app.post("/upload", async (req: Request, res: Response) => {
  const {
    gitURL,
    slug,
    buildCommand,
    subDirectory,
    outputDirectory,
    installCommand,
  } = req.body;
  const projectSlug = slug ? slug : generateSlug();

  // Spin the container
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: "ENABLED",
        subnets: [
          process.env.ECS_SUBNET1,
          process.env.ECS_SUBNET2,
          process.env.ECS_SUBNET3,
          process.env.ECS_SUBNET4,
          process.env.ECS_SUBNET5,
          process.env.ECS_SUBNET6,
        ],
        securityGroups: [process.env.ECS_SECURITY_GROUP],
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: process.env.ECS_IMAGE_NAME,
          environment: [
            { name: "GIT_REPOSITORY__URL", value: gitURL },
            { name: "PROJECT_ID", value: projectSlug },
            { name: "BUILD_COMMAND", value: buildCommand },
            { name: "SUBDIRECTORY", value: subDirectory },
            { name: "INSTALL_COMMAND", value: installCommand },
            { name: "OUTPUT_DIRECTORY", value: outputDirectory },
          ],
        },
      ],
    },
  });

  await ecsClient.send(command);

  return res.json({
    status: "queued",
    data: { projectSlug, url: `http://${projectSlug}.${REVERSE_PROXY_DOMAIN}` },
  });
});

app.listen(PORT, () => console.log(`API Server Running..${PORT}`));
