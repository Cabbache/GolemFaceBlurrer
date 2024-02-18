#!/bin/bash

set -e 

docker build -t blur .

gvmkit-build blur --push --nologin --upload-workers 10
