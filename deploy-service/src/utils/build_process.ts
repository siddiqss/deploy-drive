import { exec } from "child_process";
import path, { resolve } from "path";

export const buildProject = (id: String) => {
  return new Promise((resolve) => {
    const child = exec(
      `cd ${path.join(
        __dirname.slice(0, __dirname.length - 6),
        `/output/${id}`
      )} && npm install && npm run build`
    );

    child.stdout?.on("data", (data) => console.log(data));

    child.stderr?.on("data", (data) => console.log(data));

    child.on("close", () => resolve(""));
  });
};
