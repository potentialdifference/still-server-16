#!/bin/bash

curl -vk --header "Authorization: j2GY21Djms5pqfH2" "https://localhost:8443/private?uid=$1" -F front=@scripts/test.jpg -F front=@scripts/test1.jpg -F rear=@scripts/test2.jpg
