# Build the image
docker build -t my-app .

# Run it
docker run -d -p 3000:3000 -p 5000:5000 my-app

# Export for another machine
docker save -o my-app.tar my-app

# On another machine
docker load -i my-app.tar
docker run -d -p 3000:3000 -p 5000:5000 my-app