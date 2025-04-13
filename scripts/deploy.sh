#!/bin/bash

# Exit on any error
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
required_vars=(
  "MONGODB_URI"
  "TWILIO_ACCOUNT_SID"
  "TWILIO_AUTH_TOKEN"
  "TWILIO_PHONE_NUMBER"
  "ADMIN_API_KEY"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: Required environment variable $var is not set"
    exit 1
  fi
done

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check required commands
required_commands=(
  "docker"
  "docker-compose"
  "npm"
  "node"
)

for cmd in "${required_commands[@]}"; do
  if ! command_exists "$cmd"; then
    echo "Error: Required command $cmd is not installed"
    exit 1
  fi
done

echo "Starting deployment process..."

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run linting
echo "Running linter..."
npm run lint

# Run tests
echo "Running tests..."
npm test

# Build application
echo "Building application..."
npm run build

# Build Docker image
echo "Building Docker image..."
docker build -t smscavenger:latest .

# Run load tests
echo "Running load tests..."
npm run test:load:dev

# Check if load tests passed
if [ $? -eq 0 ]; then
  echo "Load tests passed successfully"
else
  echo "Load tests failed"
  exit 1
fi

# Deploy application
echo "Deploying application..."
if [ "$NODE_ENV" = "production" ]; then
  # Production deployment steps
  docker-compose -f docker-compose.prod.yml up -d
else
  # Development deployment steps
  docker-compose up -d
fi

# Wait for application to start
echo "Waiting for application to start..."
sleep 5

# Check if application is running
if curl -s http://localhost:3000/health | grep -q "healthy"; then
  echo "Application deployed successfully"
else
  echo "Application failed to start"
  exit 1
fi

# Monitor logs
echo "Monitoring application logs..."
if [ "$NODE_ENV" = "production" ]; then
  docker-compose -f docker-compose.prod.yml logs -f app
else
  docker-compose logs -f app
fi 