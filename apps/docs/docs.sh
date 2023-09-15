#! /bin/bash

REQUIRED_PKG="widdershins"
PKG_OK=$(widdershins --version) 

echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
  echo "No $REQUIRED_PKG"
  read -p "Would you like to install $REQUIRED_PKG ? (y/n) " -n 1 -r
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
    exit 1
  fi
  npm i -g widdershins
else
  curl --location --request GET '[::1]:3000/api-json' > ./apps/docs/api.json;
  widdershins --omit-header --environment ./apps/docs/env.json ./apps/docs/api.json -o ./apps/docs/source/includes/_api.md
  
 
fi


