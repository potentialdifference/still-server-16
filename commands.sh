#!/bin/sh

function dnPut() {
    echo "$1"
    curl -ik -H "Authorization: x9RHJ2I6nWi376Wa" -X PUT "https://192.168.2.31:8443$1" &
}

function dnView() {
    dnPut "/broadcast/$1/viewRemote?type=$2&url=http://192.168.2.31:8080/public/$3"
}

function dnViewRemote() {
    dnPut "/broadcast/$1/viewRemote?type=$2&url=$2"
}

function dnViewLocal() {
    dnPut "/broadcast/$1/viewLocal?type=$2&name=$3"
}

function dnStreamCamera() {
    dnPut "/broadcast/$1/streamCamera?camera=$2&width=$3&height=$4"
}

function dnStreamCameraTo() {
    dnPut "/broadcast/$1/streamCamera?camera=$2&width=$3&height=$4&to=$6&from=$5"
}

function dnViewStream() {
    dnPut "/broadcast/$1/viewStream?width=$2&height=$3&from=$4"
}

function dnSaveLocally() {
    dnPut "/broadcast/$1/saveLocally?name=$2&url=http://192.168.2.31:8080/public/$2"
}

function dnInfo() {
    dnPut "/broadcast/$1/info"
}

function dnStop() {
    dnPut "/broadcast/$1/stop"
}
