"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const DOMAIN = "localhost:8000";
const SOCKET_SERVER_URL = "http://localhost:9002"
const API_SERVER_URL = "http://localhost:9000"

export default function Home() {
  const [projectName, setProjectName] = useState<string>("");
  const [projectUrl, setProjectUrl] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [subDirectory, setSubdirectory] = useState<string>("");
  const [buildCommand, setBuildCommand] = useState<string>("");
  const [outputDirectory, setOutputDirectory] = useState<string>("");

  function handleProjectName(e: any) {
    e.preventDefault();
    setProjectName(e.target.value);
  }

  function handleProjectUrl(e: any) {
    e.preventDefault();
    setProjectUrl(e.target.value);
  }

  function handleSubdirectory(e: any) {
    e.preventDefault();
    setSubdirectory(e.target.value);
  }

  function handleBuildCommand(e:any){
    e.preventDefault();
    setBuildCommand(e.target.value);
  }

  function handleOutputDirectory(e:any){
    e.preventDefault();
    setOutputDirectory(e.target.value);
  }

  const handleUpload = async () => {
    if (projectName !== "" && projectUrl !== "") {
      setStatus("Uploading...");
      const res = await axios.post(`${API_SERVER_URL}/upload`, {
        gitURL: projectUrl,
        // projectName: projectName,
        subDirectory,
        buildCommand,
        outputDirectory
      });
      console.log(res);
      setProjectId(res.data.data.projectSlug);

      setStatus(`Deploying... ${res.data.data.projectSlug}`);

    }
  };

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);
  
    socket.on("connect", () => {
      socket.emit("subscribe", projectId)
    });

    socket.on("message", (data) => {
      console.log(data)
    });

    return () => {
      socket.disconnect();
    };
  }, [projectId]);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      {status.includes("Deployed") && (
        <Alert className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Your site is live 🥳</AlertTitle>
          <AlertDescription>
            Access Now{" "}
            <a
              className="text-green-600"
              target="_blank"
              href={`http://${projectId}.${DOMAIN}`}
            >
              {projectId}.{DOMAIN}
            </a>
            🎉
          </AlertDescription>
        </Alert>
      )}

      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>
            Deploy your new project in one-click.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Name of your project"
                  value={projectName}
                  onChange={handleProjectName}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Project URL</Label>
                <Input
                  id="project_url"
                  placeholder="https://github.com/johndoe/projectxyz"
                  value={projectUrl}
                  onChange={handleProjectUrl}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Build Command (Optional)</Label>
                <Input
                  id="build"
                  placeholder="npm run build"
                  value={buildCommand}
                  onChange={handleBuildCommand}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Sub Directory (Optional)</Label>
                <Input
                  id="rootdir"
                  placeholder="e.g. frontend"
                  value={subDirectory}
                  onChange={handleSubdirectory}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Output Directory (Optional)</Label>
                <Input
                  id="output-dir"
                  placeholder="dist"
                  value={outputDirectory}
                  onChange={handleOutputDirectory}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="framework">Framework</Label>
                <Select defaultValue={"react"}>
                  <SelectTrigger id="framework">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="react">React.js</SelectItem>
                    <SelectItem value="next" disabled>
                      Next.js
                    </SelectItem>
                    <SelectItem value="sveltekit" disabled>
                      SvelteKit
                    </SelectItem>
                    <SelectItem value="astro" disabled>
                      Astro
                    </SelectItem>
                    <SelectItem value="nuxt" disabled>
                      Nuxt.js
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 justify-between">
          {/* <Button variant="outline">Cancel</Button> */}

          <Button onClick={handleUpload} disabled={projectId !== ""}>
            {projectId !== "" ? status : "Upload"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
