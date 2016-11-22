#!/bin/bash

curl -k -X POST "https://localhost:8443/broadcast/text?message=$1"
