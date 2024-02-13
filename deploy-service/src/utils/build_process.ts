import { exec } from "child_process";
import path from "path";

// child = exec(
//   `cd ${path.join(
//     __dirname.slice(0, __dirname.length - 6),
//     `/output/${id}`
//   )} && npm install && npm run build`
// );

export const buildProject = (
  id: string,
  subDirectory: string,
  buildCommand: string
) => {

  
  return new Promise((resolve) => {
    let child;
    const projectPath =
      subDirectory !== ""
        ? path.join(
            __dirname.slice(0, __dirname.length - 6),
            `/output/${id}/${subDirectory}`
          )
        : path.join(__dirname.slice(0, __dirname.length - 6), `/output/${id}`);

    const commandToRun = buildCommand !== "" ? buildCommand : "npm run build";
    console.log(commandToRun)

    child = exec(`cd ${projectPath} && npm install && ${commandToRun}`);

    child.stdout?.on("data", (data) => console.log(data));

    child.stderr?.on("data", (data) => console.log(data));

    child.on("close", () => resolve(""));
  });
};
