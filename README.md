### DeployDrive: Deploy your React App in 1 step (v2)
Production-ready scalable microservice architecture

* Paste your GitHub/GitLab project URL
* Put your deployment configs (output directory, build command, install command, subdirectory)

### Microservice Architecture
![Deploy Drive Microservice Architecture](./assets/deploy%20drive%20v2%20architecture.png)

1. Build Service
2. REST API Service
3. Reverse Proxy Service (request handler)
4. Logs service (streams log to frontend)

### Tech Stack
* Node.js (Express.js)
* Socket.io
* TypeScript
* AWS Elastic Container Registry
* AWS Elastic Container Service
* AWS S3

