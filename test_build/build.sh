#!/bin/bash

# docker login ccr.ccs.tencentyun.com --username=384369178 
# pwd=2BfxNjLPinz6ah2F
project_name="feishu-pdf-batch-merger"
version="latest"
# cd ../ && pnpm install && pnpm run build
cd ../
cd test_build && copy ../dist/ .

# 给apple芯片使用的buildx
# docker buildx build  --platform linux/amd64 -t $project_name:$version .
docker build -t $project_name:$version .

rm -rf dist