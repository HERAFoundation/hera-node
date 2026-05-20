#!/bin/sh
# Runs once on container init to configure Kubo.
# Mounted into /container-init.d/ which Kubo executes automatically.

ipfs config --json Import.CIDVersion 1
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin "[\"${ALLOWED_ORIGIN}\"]"
ipfs config --json Gateway.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
