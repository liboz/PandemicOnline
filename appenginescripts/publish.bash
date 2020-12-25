cp app.yaml dist/app.yaml
cp package.json dist/package.json
sed -i "/\"start\":/c\\\"start\": \"node server.js\"" dist/package.json
cat dist/package.json