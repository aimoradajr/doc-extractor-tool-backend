# Deployment Guide

This backend is deployed live using [Render.com](https://render.com) under the free Hobby pricing model.

## Deployment Workflow

- The GitHub repository is connected directly to Render.
- The `main` branch is used for automatic deployments.
- On each push to `main`, Render builds and deploys the latest code.

## Render Settings

- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  node dist/index.js
  ```
- **Environment Variables:**
  - You can export your `.env` variables directly in the Render dashboard.

Example `.env`:

```env
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=sk-proj-68...
OPENAI_MODEL=gpt-3.5-turbo
COMPARE_MODEL=gpt-4.1
OPENAI_PROMPT_ID=pmpt_68....
OPENAI_PROMPT_VERSION=6
```

> **Note:** Your OpenAI API key must have permissions for Models, Files, and Responses API. See the README for details.

## No manual server setup required

- No need to manually clone the repo or set up a server.
- All deployment and scaling is handled by Render.
- For production, upgrade to a paid plan for more resources and uptime.

## Main Flow: Deploying to Render.com

1. **Sign up or log in to Render.com**
2. **Create a new Web Service**
   - Click "New Web Service" from the Render dashboard.
   - Connect your GitHub repository and select the `main` branch.
3. **Configure build and start commands**
   - Build command: `npm install && npm run build`
   - Start command: `node dist/index.js`
4. **Set environment variables**
   - Add your `.env` values in the Render environment settings.
5. **Deploy**
   - Click "Create Web Service" to start the first build and deployment.
   - Render will automatically redeploy on every push to `main`.

> For troubleshooting, check the Render build logs and service dashboard.
