import { DynamoDB, S3, SQS } from "aws-sdk";
import { GetItemInput } from "aws-sdk/clients/dynamodb";
import fs from "fs";
const dotenv = require("dotenv");
dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: process.env.S3_BUCKET!,
      Key: fileName,
    })
    .promise();
};

const sqs = new SQS({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

export const sendMessageToQueue = async (id: string, subDirectory: string, buildCommand: string, outputDirectory:string) => {
  const params = {
    MessageBody: JSON.stringify({
      uploadId: id,
      subDirectory,
      buildCommand,
      outputDirectory
    }),
    MessageGroupId: "upload-service-response",
    QueueUrl: process.env.SQS_URL!,
  };

  console.log(params.MessageBody)

  await sqs.sendMessage(params).promise();
};

const dynamoDB = new DynamoDB({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

export const updateStatusInDB = async (id: string, projectName: string) => {
  const params = {
    TableName: process.env.DYNAMO_DB_TABLE_NAME!,
    Item: {
      id: { S: id },
      status: { S: "uploaded" },
      project_name: { S: projectName },
      createdAt: { S: new Date().toISOString() },
    },
  };

  const response = await dynamoDB.putItem(params).promise();
  return response;
};

export const getStatusFromDB = async (id: string) => {
  const params: GetItemInput = {
    TableName: process.env.DYNAMO_DB_TABLE_NAME!,
    Key: {
      id: {
        S: id,
      },
    },
  };

  const res = await dynamoDB.getItem(params).promise();
  return res.Item!.status;
};
