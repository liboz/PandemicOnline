docker build -f ./Dockerfile . -t pandemicserver
if %errorlevel% neq 0 exit /b %errorlevel%
docker run -p 8080:8080 pandemicserver