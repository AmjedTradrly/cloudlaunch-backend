# CloudLaunch Backend

Independent Express + MongoDB REST API for CloudLaunch.

## Setup

```bash
npm install
copy .env.example .env
npm run dev
```

Required environment variables:

```env
PORT=3001
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/cloudlaunch
```

`CLIENT_URL` is a comma-separated CORS allowlist. For example:

```env
CLIENT_URL=http://localhost:5173,https://app.example.com
```

## API

- `GET /api` — API metadata
- `GET /api/health` — API and MongoDB status
- `POST /api/auth/signup` — create an account
- `POST /api/auth/signin` — authenticate an account

This folder can be moved into its own Git repository and deployed to AWS App Runner, ECS, or Elastic Beanstalk. Store `JWT_SECRET` and `MONGODB_URI` in AWS Secrets Manager or encrypted environment variables.
