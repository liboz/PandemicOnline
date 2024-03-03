# PandemicOnline

Online Pandemic Simulator with React + pixi.js frontend. Hosted at https://pandemic.live

# Notes

- Better UI look → Try pixi.js
- Change detection library with pixi doesn't exist in angular → React

# Deploy

`GCP_SA_KEY` was generated by

1. Creating a service account with `Firebase Hosting Admin` permissions
1. Create + Download JSON key for the service account
1. Ran `openssl base64 -in yourfile.json -out output.txt` to base64 encode the json key
1. Copy the base64 encoded key in `output.txt` into the `GCP_SA_KEY` secret in Github

# TODO

- removeChild on Node (node is removed is not part of this node) https://github.com/facebook/react/issues/11538
- Implement Contingency Planner
