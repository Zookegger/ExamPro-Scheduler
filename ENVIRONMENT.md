# Environment Configuration Guide

This project uses separate environment files for local development and Docker deployment.

## Environment Files

### 📄 `.env` (Local Development)

Used when running the application locally (outside Docker).

```bash
# Database Configuration (Local)
DB_HOST=localhost     # Connect to local MySQL
DB_PORT=3307         # Use port 3307 (Docker MySQL external port)
NODE_ENV=development
```

### 📄 `.env.docker` (Docker Deployment)

Used when running the application in Docker containers.

```bash
# Database Configuration (Docker)
DB_HOST=mysql_db     # Connect to MySQL container
DB_PORT=3306         # Use internal Docker port
NODE_ENV=production
```

### 📄 `.env.example` (Template)

Template file with all environment variables and comments.

## Usage

### 🚀 Local Development

```bash
# Uses .env file
npm run dev
# or
npm run server  # Backend only
npm run client  # Frontend only
```

### 🐳 Docker Deployment

```bash
# Uses .env.docker file automatically
docker-compose up -d
```

## Setup Instructions

### First Time Setup

1. Copy environment template:

    ```bash
    cp .env.example .env
    ```

2. Update `.env` with your local configuration:

    - Set your MySQL password
    - Update database connection details
    - Configure JWT secret

3. For Docker, the `.env.docker` is ready to use as-is.

### Environment Variables Explanation

| Variable   | Local (.env)  | Docker (.env.docker) | Description         |
| ---------- | ------------- | -------------------- | ------------------- |
| `DB_HOST`  | `localhost`   | `mysql_db`           | Database host       |
| `DB_PORT`  | `3307`        | `3306`               | Database port       |
| `NODE_ENV` | `development` | `production`         | Runtime environment |

## Troubleshooting

### Local Development Issues

-   **Database connection error**: Check if MySQL is running locally on port 3307
-   **Port conflicts**: Make sure ports 3000 and 5000 are available

### Docker Issues

-   **MySQL connection error**: Run `docker-compose logs mysql_db` to check database status
-   **Build failures**: Run `docker-compose build --no-cache` to rebuild from scratch

### Switching Between Environments

-   **From Docker to Local**: Stop Docker containers with `docker-compose down`
-   **From Local to Docker**: Stop local servers (Ctrl+C) then run `docker-compose up -d`

## File Structure

```
project/
├── .env                 # Local development (gitignored)
├── .env.docker         # Docker environment (gitignored)
├── .env.example        # Template (committed to git)
└── docker-compose.yml  # Uses .env.docker
```

## Security Notes

-   Never commit `.env` or `.env.docker` files to version control
-   Use strong passwords and JWT secrets in production
-   Change default passwords before deployment
