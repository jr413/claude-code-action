# Video Streaming Platform MVP

A modern video streaming platform built with React, Express, and PostgreSQL.

## Features

- User authentication with JWT
- Video content management
- Stripe payment integration
- Video streaming with HLS support
- User dashboard and profiles
- Subscription management

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- PostgreSQL database
- JWT authentication
- Stripe API integration
- AWS S3 for video storage

### Frontend
- React + Vite
- Tailwind CSS
- Video.js player
- React Router
- Axios for API calls

## Project Structure

```
video-streaming-app/
├── backend/           # Express API server
├── frontend/          # React application
├── database/          # Database schemas and migrations
└── docs/             # Documentation
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Stripe account
- AWS account (for S3)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up database:
```bash
# Create database
createdb video_streaming_db

# Run migrations
npm run db:migrate
```

4. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. Start development server:
```bash
npm run dev
```

## API Documentation

See [API Documentation](./docs/API.md) for detailed endpoint information.

## Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for production deployment instructions.

## License

This project is licensed under the MIT License.