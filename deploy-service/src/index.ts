import { SQSClient } from "@aws-sdk/client-sqs";
import { Message } from "aws-sdk/clients/sqs";
import { Consumer } from "sqs-consumer";
import {
  downloadFilesFromS3,
  updateStatusInDB,
  uploadFinalDist,
} from "./utils/aws";
import { buildProject } from "./utils/build_process";
const dotenv = require("dotenv");
dotenv.config();

const createConsumer = function (
  queueUrl: string,
  batchSize: number,
  handler: any
) {
  return Consumer.create({
    queueUrl: queueUrl,
    batchSize: batchSize,
    handleMessageBatch: handler,
    sqs: new SQSClient({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    }),
  });
};

const messageHandle = async (messages: Message[]) => {
  // process messages in this function
  const body = messages[0].Body;
  console.log(body);

  if (body) {
    const id = JSON.parse(body).uploadId;
    const subDirectory = JSON.parse(body).subDirectory;
    const buildCommand = JSON.parse(body).buildCommand;
    const outputDirectory = JSON.parse(body).outputDirectory;
    console.log("parsed body");
    await downloadFilesFromS3(id);
    console.log("files downloaded from s3");
    await buildProject(id, subDirectory, buildCommand);
    console.log("build process finished");
    uploadFinalDist(id, subDirectory, outputDirectory);
    console.log("uploaded dist to S3");
    await updateStatusInDB(id);
    console.log("updated status");
  }
};

const sqsConsumer = createConsumer(
  process.env.SQS_URL!, // URL of the queue to consume
  1, // batch size -- number of messages to consume at once, <=10
  messageHandle // handler for messages
);

sqsConsumer.start();
