#!/bin/sh

function stillPut() {
    echo "$1"
    curl -ik -H "Authorization: x9RHJ2I6nWi376Wa" -X PUT "https://localhost:8443$1" &
}


function stillSendImage() {
    stillPut "/broadcast/displayImage?image=$1"
}

function stillSendText() {
    stillPut "/broadcast/displayText?content=$1"
}

function stillHide() {
    stillPut "/broadcast/hideImage"
}

