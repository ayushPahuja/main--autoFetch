# Indigg Common Backend

- This repository has APIs for Indigg Consumer App MVP. Using Nestjs + Typescript.
- Async pattern - async await
- Backend DB - Cognito, Dynamodb
- Partner api integration - Mudrex, Covalent, Infura

## Branches
- pre-prod is the main branch. Developers develop in feature branch and push to pre-prod. 
- AWS code pipeline manages pre-prod build on commit to pre-prod and leads control the pipeline to push to prod
- AWS preprod and prod environment have associated resources for the corresponding environment 

## Setup

### Environment variables
-   You need to create .env file in your base directory. The environment variables can either be setup for preprod or prod
-   There is no need to run any DB locally. All resources will be used from AWS
-   Local environment has to be configured for AWS access

### Running the application
-   git clone <>
-   cd api-backend
-   npm install --force
-   npm run start

### API endpoints
-   Swagger documentation and playground is available to run the APIs
-   Postman can be used for scripting

### Accessing from frontend
-   In .env of frontend, set API_URL to "http://localhost:3001/"


