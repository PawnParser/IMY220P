# IMY220P
2025 IMY 220 Project
This project has the purpose of developing a version control website in react.
The wireframes for this project are in the process of being developed.

Docker Commands:

# Build and start all services
docker-compose up --build

# Start services in detached mode
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose build app

# Access MongoDB shell
docker exec -it mongodb mongosh

MongoDB Connection String for submission:
mongodb://mongodb:27017/versioncontrol

For production, use MongoDB Atlas connection string:
mongodb+srv://username:password@cluster.mongodb.net/versioncontrol