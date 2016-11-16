var fs = require('fs')
, http = require('http').createServer()
, key  = fs.readFileSync('ssl/server.key')
, cert = fs.readFileSync('ssl/server.crt')
, https = require('https').createServer({key: key, cert: cert})
, WebSocketServer = require('ws').Server
, wss = new WebSocketServer({ server: http })
, express = require('express')
, multer = require('multer')
, util = require('util')
, _ = require('underscore')
, publicApp = express()
, privateApp = express()
, httpPort = 8080
, httpsPort = 8443


var privateStorage = multer({ storage: multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'private/', ".")
    },
    filename: function (req, file, cb) {
	cb(null, file.originalname)
    }
})})

var publicStorage = multer({ storage: multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
}) })


wss.broadcast = function broadcast(data) {
    var message = JSON.stringify(data)
    wss.clients.forEach(function each(client) {
        try {
            client.send(message)
        } catch(err) {
            console.log("error sending " + message)
        }
    })
}

privateApp.post('/public',
         publicStorage.single('image'),
         function (req, res, next) {
             wss.broadcast({'instruction': 'displayImage',
                            'path': '/public/' + req.file.filename})
             res.status(204).end()
         })

privateApp.post('/private',
         privateStorage.array('images[]'),
         function (req, res, next) {
             console.log("request to private app upload")
             res.status(204).end()
         })

privateApp.post('/broadcast/text',
                function (req, res, next) {
                    console.log("request to broadcast text: " + req.query.message)
                    wss.broadcast({'instruction': 'displayText',
                                   'content': req.query.message})
                    res.status(204).end()
                })


publicApp.use('/public',  express.static('public'))

https.on('request', privateApp)
http.on('request', publicApp)

http.listen(httpPort, function () {
    console.log("HTTP Server listening on port " + http.address().port)
})

https.listen(httpsPort, function() {
    console.log("HTTPS server listening on port " + https.address().port)
})


