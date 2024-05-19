docker stop cnm-client
docker rm cnm-client
docker rmi cnm-client
docker build -t client_workchat .
docker run -d -p 3000:3000 --name cnm-client client_workchat