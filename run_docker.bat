#!/bin/bash
docker build -f ./PandemicServer/Dockerfile . -t pandemicserver
docker run -p 8080:8080 pandemicserver