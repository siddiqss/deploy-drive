import fs from "fs";
import path from "path";

export default function getAllFiles(dir: string) {
  let response: string[] = [];
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const fullFilePath = path.join(dir, file);
    if (fs.statSync(fullFilePath).isDirectory()) {
      response = response.concat(getAllFiles(fullFilePath));
    } else {
      response.push(fullFilePath);
    }
  }

  return response;
}
