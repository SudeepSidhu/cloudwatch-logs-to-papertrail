#!/usr/bin/env bash

# This script builds the TypeScript code into the default lambda-files directory
# as specified in tsconfig.json. Next, it installs the production dependencies.
# This code should be checked in to version control to make it available to users
# through the Terraform module

set -e
set -u
set -o pipefail

mkdir -p lambda-files
npm run-script build
cp package.json lambda-files
cd lambda-files || exit "Directory 'lambda-files' does not exist"
npm install --no-package-lock --production
rm package.json
cd ..
# Remove unnecessary files from node_modules before checking in to version control
./node_modules/.bin/modclean --no-progress --run --path lambda-files
# Overwrite the lambda-files folder in tf_module
rm -rf tf_module/lambda-files
mv lambda-files tf_module