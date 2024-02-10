import { S3, SQS } from "aws-sdk";
import fs from "fs";
const dotenv = require("dotenv")
dotenv.config()

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: "deploy-drive",
      Key: fileName,
    })
    .promise();

  console.log(response);
};

const sqs = new SQS({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION
})

export const sendMessageToQueue = async (id:string)=>{
    const params = {
        MessageBody: JSON.stringify({
            uploadId: id
        }),
        MessageGroupId: "upload-service-response",
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/512110725800/DeployDrive_BuildQueue.fifo",
    }

    await sqs.sendMessage(params).promise();

}