var fs = require('fs')
  , http = require('http').createServer()
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: http })
  , express = require('express')
  , multer = require('multer')
  , util = require('util')
  , _ = require('underscore')
  , app = express()
  , httpPort = 8080

var privateStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'private/', ".")
    },
    filename: function (req, file, cb) {
        console.log(file.originalname)
	cb(null, file.originalname || "TODO")
    }
})

var upload = multer({ storage: privateStorage })

app.post('/private',
         upload.array('images[]'),
         function (req, res, next) {
             console.log("request to private app upload")
             res.status(204).end()
         })

http.on('request', app)

// app.use('/public',  express.static('public'))

http.listen(httpPort, function () {
    console.log("HTTP Server listening on port " + http.address().port)
})
