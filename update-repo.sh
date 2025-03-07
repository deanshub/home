# Define the path to your project directory
PROJECT_DIR="/home/dean/dev/home"

# Change to the project directory
cd "$PROJECT_DIR" || { echo "Failed to change directory to $PROJECT_DIR"; exit 1; }

# Pull the latest changes from the Git repository
git pull

# Restart the Docker containers
docker compose up -d

# Log the execution time
echo "$(date): Updated repository and restarted Docker containers" >> /var/log/git_docker_cron.log