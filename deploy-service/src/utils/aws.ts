import { DynamoDB, S3 } from "aws-sdk";
import fs from "fs";
import path from "path";
import getAllFiles from "./getAllFiles";
const dotenv = require("dotenv");
dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const downloadFilesFromS3 = async (prefix: string) => {
  const allFiles = await s3
    .listObjectsV2({
      Bucket: process.env.S3_BUCKET_NAME!,
      Prefix: prefix,
    })
    .promise();

  const allPromises =
    allFiles.Contents?.map(async (file) => {
      return new Promise(async (resolve) => {
        if (!file.Key) {
          resolve("");
          return;
        }

        // output should be in dist not in utils
        const finalOutputPath = path.join(
          __dirname.slice(0, __dirname.length - 6),
          `/output/${file.Key}`
        );
        const dirName = path.dirname(finalOutputPath);
        if (!fs.existsSync(dirName)) {
          fs.mkdirSync(dirName, { recursive: true });
        }
        const outputFile = fs.createWriteStream(finalOutputPath);
        s3.getObject({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: file.Key || "",
        })
          .createReadStream()
          .pipe(outputFile)
          .on("finish", () => {
            resolve("");
          });
      });
    }) || [];

  await Promise.all(allPromises?.filter((x) => x !== undefined));
};

const uploadFile = async (fileName: string, localFilePath: string) => {
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3
    .upload({
      Body: fileContent,
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
    })
    .promise();
};

export const uploadFinalDist = (
  id: string,
  subDirectory: string,
  outputDirectory: string
) => {
  let folderPath;
  let baseOutputDirectory = "dist";

  if (outputDirectory !== "") {
    baseOutputDirectory = outputDirectory;
  }

  if (subDirectory !== "") {
    folderPath = path.join(
      __dirname.slice(0, __dirname.length - 6),
      `/output/${id}/${subDirectory}/${baseOutputDirectory}`
    );
  } else {
    folderPath = path.join(
      __dirname.slice(0, __dirname.length - 6),
      `/output/${id}/${baseOutputDirectory}`
    );
  }

  const allFiles = getAllFiles(folderPath);

  allFiles.forEach((file) => {
    uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
  });
};

const dynamoDB = new DynamoDB({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
});

export const updateStatusInDB = async (id: string) => {
  const params = {
    TableName: process.env.DYNAMO_DB_TABLE_NAME!,
    Item: {
      id: { S: id },
      status: { S: "deployed" },
      updatedAt: { S: new Date().toISOString() },
    },
  };

  const response = await dynamoDB.putItem(params).promise();
  return response;
};
