var server = require('http').createServer()
  , url = require('url')
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: server })
  , express = require('express')
  , multer = require('multer')
  , util = require('util')
  , app = express()
  , port = 3000;

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
        cb(null, 'private/')
    },
    filename: function (req, file, cb) {
        var name = util.format('%s-%s-%s',
                               req.query.uid,
                               req.query.tag,
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

app.use('/public', express.static('public'))

var privateAuth = requireAuth('stillappkey579xtz')
var publicAuth = requireAuth('wE5oD8mEk0ghAit4')

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
                            'path': 'public/' + req.file.filename})
             res.status(204).end()
         })

app.put('/broadcast/displayImage',
        publicAuth,
        function (req, res, next) {
            if (req.query.image) {
                wss.broadcast({'message': 'displayImage',
                               'path': 'public/' + req.query.image})
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

server.on('request', app);

server.listen(port, function () {
    console.log("Server listening on port " + server.address().port);
});
