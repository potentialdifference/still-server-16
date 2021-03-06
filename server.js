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
  , httpsPort = 8443
  , httpPort = 8080
  ,  ipRegExp = /\d+.\d+.\d+.\d+/
  


var requireAuth = function(key) {
    return function (req, res, next) {	
        if (req.headers.authorization != key) {
	    console.log("Invalid Auth:")
            console.log(req)
            res.status(401).end()
        } else {
            next()
        }
    }
}


wss.on('connection', function connection(client){
	
	console.log("connection from " +  ipRegExp.exec(client.upgradeReq.connection.remoteAddress))
	client.on('close', function () {
		console.log('stopping client interval');
    
	});
	
	
	})

wss.broadcast = function broadcast(data) {
    var message = JSON.stringify(data), count = 0
    console.log("sending message: ", data.instruction)
    wss.clients.forEach(function each(client) {
	client.send(message, function handler(error){
	    if (!error){
		count++
	    } else {
		console.log("failed broadcasting to client: "+error)
	    }
	})
    })
}

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


var upload = multer({ storage: multer.diskStorage({		
        destination: function (req, file, cb) {
            cb(null, util.format('private/%s/', file.fieldname || "other"))
			console.log("uploading: "+JSON.stringify(file))
        },
        filename: function (req, file, cb) {
            var name = util.format('%s-%s-%s-%s',
                                   req.query.uid,
                                   file.fieldname,
			           new Date().valueOf(),
                                   file.originalname)
            cb(null, name);
        }
    })})

// This is where the audience uploads to
app.post('/private',
         privateAuth,         
	 upload.fields([{name: 'front', maxCount: 10 },
                        {name: 'rear', maxCount: 10},
                        {name: 'other', maxCount: 10}]),
         function (req, res, next) {			 
             res.status(204).end()
         })

// This is where QLab will upload images
// It also broadcasts a message to all websocket clients
app.post('/public',
         publicAuth,
         multer({ storage: publicStorage }).single('image'),
         function (req, res, next) {
             wss.broadcast({'instruction': 'displayImage',
                            'path': '/public/' + req.file.filename})
             res.status(204).end()
         })

app.put('/broadcast/displayImage',
        publicAuth,
        function (req, res, next) {
            if (req.query.image) {
                wss.broadcast({'instruction': 'displayImage',
                               'path': '/public/' + req.query.image})
                res.status(204).end()
            } else {
                res.status(400).end()
            }
        })

app.put('/broadcast/hideImage',
        publicAuth,
        function (req, res, next) {
            wss.broadcast({'instruction': 'hideImage'})
            res.status(204).end()
        })		

		
app.put('/broadcast/displayText',
        publicAuth,
        function (req, res, next) {

            wss.broadcast({'instruction': 'displayText',
							'content': req.query.content,
							'notify' :true})
            res.status(204).end()
        })

app.put('/broadcast/exitShowMode',
        publicAuth,
        function (req, res, next) {
            wss.broadcast({'instruction': 'exitShowMode'})
            res.status(204).end()
        })
		
setInterval(function(){wss.broadcast({'instruction': 'keepAlive'})}, 30000)

// Above is all done over HTTPS to protect tokens
https.on('request', app);
http.on('request', publicApp)

// Start servers
https.listen(httpsPort, function () {
    console.log("HTTPS Server listening on port " + https.address().port)
});

http.listen(httpPort, function () {
    console.log("HTTP Server listening on port " + http.address().port)
});

// Below serves the public directory over http
//was publicApp:
app.use('/public', [/* removed for now - privateAuth,*/ express.static('public')])
