var fs = require('fs')
  , key  = fs.readFileSync('ssl/server.key')
  , cert = fs.readFileSync('ssl/server.crt')
  , https = require('https').createServer({key: key, cert: cert})
  , http = require('http').createServer()
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: http })
  , express = require('express')
  , multer = require('multer')
  , util = require('util')
  , app = express()
  , publicApp = express() 
  , httpsPort = 8080
  , httpPort = 8081;

var requireAuth = function(key) {
    return function (req, res, next) {	
        if (req.headers.authorization != key) {
            res.status(401).end()
        } else {
            next();
        }
    }
}

wss.broadcast = function broadcast(data) {
    var message = JSON.stringify(data)
    wss.clients.forEach(function each(client) {
        client.send(message)
    })
}

var privateStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        var folder
        switch (req.query.tag) {
        case 'front':
        case 'rear':
            folder = req.query.tag
            break
        default:
            folder = 'other'
        }        
        cb(null, util.format('private/%s/', folder))
    },
    filename: function (req, file, cb) {
        var name = util.format('%s-%s-%s-%s',
                               req.query.uid,
                               req.query.tag,
							new Date().valueOf(),
                               file.originalname)
        cb(null, name)
    }
})

var publicStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

var privateAuth = requireAuth('j2GY21Djms5pqfH2')
var publicAuth  = requireAuth('x9RHJ2I6nWi376Wa')


// This is where the audience uploads to
app.post('/private',
         privateAuth,
         multer({ storage: privateStorage }).single('image'),
         function (req, res, next) {
             res.status(204).end()
         })

// This is where QLab will upload images
// It also broadcasts a message to all websocket clients
app.post('/public',
         publicAuth,
         multer({ storage: publicStorage }).single('image'),
         function (req, res, next) {
             wss.broadcast({'message': 'displayImage',
                            'path': '/public/' + req.file.filename})
             res.status(204).end()
         })

app.put('/broadcast/displayImage',
        publicAuth,
        function (req, res, next) {
            if (req.query.image) {
                wss.broadcast({'message': 'displayImage',
                               'path': '/public/' + req.query.image})
                res.status(204).end()
            } else {
                res.status(400).end()
            }
        })

app.put('/broadcast/hideImage',
        publicAuth,
        function (req, res, next) {
            wss.broadcast({'message': 'hideImage'})
            res.status(204).end()
        })

app.put('/broadcast/exitShowMode',
        publicAuth,
        function (req, res, next) {
            wss.broadcast({'message': 'exitShowMode'})
            res.status(204).end()
        })

// Above is all done over HTTPS to protect tokens
https.on('request', app);

// Start servers
https.listen(httpsPort, function () {
    console.log("HTTPS Server listening on port " + https.address().port)
});

http.listen(httpPort, function () {
    console.log("HTTP Server listening on port " + http.address().port)
});

// Below serves the public directory over https
app.use('/public', [privateAuth, express.static('public')])
