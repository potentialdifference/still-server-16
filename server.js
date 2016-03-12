var fs = require('fs')
  , key  = fs.readFileSync('ssl/server.key')
  , cert = fs.readFileSync('ssl/server.crt')
  , https = require('https').createServer({key: key, cert: cert})
  , http = require('http').createServer()
  , http2 = require('http').createServer()  
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: http })
  , express = require('express')
  , multer = require('multer')
  , util = require('util')
  , _ = require('underscore')
  , app = express()
  , publicApp = express() 
  , httpsPort = 8080
  , httpPort = 8081
  , http2Port = 8089;
  


var requireAuth = function(key) {
    return function (req, res, next) {	
        if (req.headers.authorization != key) {
            res.status(401).end()
        } else {
            next();
        }
    }
}



var deviceGroups = {
	"lenovo" : ["192.168.2.30"],
	"samsung-phone" : ["192.168.2.33"],
	"samsung-tablet" : ["192.168.2.47"],
	"nexus-7" : ["192.168.2.48"],
	"htc-one" : ["192.168.2.50"],
	"phones" : ["192.168.2.33", "192.168.2.50"],
	"tablets" : ["192.168.2.30", "192.168.2.47","192.168.2.48" ],
	"all" : ["192.168.2.30", "192.168.2.47","192.168.2.33", "192.168.2.48", "192.168.2.50"]
	//etc...
}



wss.broadcast = function broadcast(data) {
    var message = JSON.stringify(data)
	
    wss.clients.forEach(function each(client) {		
        client.send(message)		
		console.log(client.upgradeReq.connection.remoteAddress)
		for(i in client) {
			console.log (i)
		}
    })
}

wss.broadcastToGroup = function broadcastToGroup(groupName, data){
	var message = JSON.stringify(data)
	console.log("broadcasting "+groupName+" "+data)
	//naive first implementation - iterate through each client and read ip address
	wss.clients.forEach(function each(client) {	
		var ipRegExp = /\d+.\d+.\d+.\d+/
		var clientIp = ipRegExp.exec(client.upgradeReq.connection.remoteAddress)+""
		
		console.log("checking "+clientIp)
		if(_.isUndefined(deviceGroups[groupName])){
			console.log("group not found "+groupName)
			//todo - make it so this returns an http error
			return
		}		
		if(_.contains(deviceGroups[groupName], clientIp)){
			console.log("sendong to "+clientIp)
			client.send(message)
		}else{
			console.log(JSON.stringify(deviceGroups[groupName]) + "doesn't contain "+clientIp)
		}
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
		

app.put('/broadcast/:groupName/displayImage',
        publicAuth,		
        function (req, res, next) {			
            if (req.query.image) {
                wss.broadcastToGroup(req.params.groupName, {'message': 'displayImage',
                               'path': '/public/' + req.query.image})
                res.status(204).end()
            } else {
                res.status(400).end()
            }
        })

app.put('/broadcast/:groupName/hideImage',
        publicAuth,		
        function (req, res, next) {			            
                wss.broadcastToGroup(req.params.groupName, {'message': 'hideImage'})
                res.status(204).end()
            
        })
		
app.put('/broadcast/:groupName/streamVideo',
        publicAuth,		
        function (req, res, next) {			
			var format = "mjpeg"
			if(req.query.format){
				format = req.query.format
			}
				
            if (req.query.url) {
                wss.broadcastToGroup(req.params.groupName, 
				{
					'message': 'streamVideo',
                    'url': req.query.url,
					'width' : req.query.width,
					'height': req.query.height,
					'format' : format
					//could add other optional params in here 
				})
                res.status(204).end()
            } else {
                res.status(400).end()
            }
			
        })
		

	
app.put('/broadcast/:groupName/startCameraStream',
        publicAuth,		
        function (req, res, next) {			
							
				
                wss.broadcastToGroup(req.params.groupName, 
				{
					'message': 'startCameraStream',
					'width' : req.query.width,
					'height': req.query.height
					//could add other optional params in here 
				})
                res.status(204).end()				
            
        })		
		
app.put('/broadcast/:groupName/openWebPage',
        publicAuth,		
        function (req, res, next) {						
				
            if (req.query.url) {
                wss.broadcastToGroup(req.params.groupName, 
				{
					'message': 'openWebPage',
                    'url': req.query.url					
				})
                res.status(204).end()
			} else if (req.query.html){
				wss.broadcastToGroup(req.params.groupName, 
				{
					'message': 'openWebPage',
                    'html': req.query.html					
				})
                res.status(204).end()			
            } else {
                res.status(400).end()
            }
			
        })		

		
app.put('/broadcast/:groupName/stop',
        publicAuth,		
        function (req, res, next) {			
            
                wss.broadcastToGroup(req.params.groupName, 
				{
					'message': 'stop',            
					//could add other optional params in here 
				})
                res.status(204).end()
            
        })

// Above is all done over HTTPS to protect tokens
https.on('request', app);

http2.on('request', publicApp);


// Start servers
https.listen(httpsPort, function () {
    console.log("HTTPS Server listening on port " + https.address().port)
});

http.listen(httpPort, function () {
    console.log("HTTP Server listening on port " + http.address().port)
});

http2.listen(http2Port, function () {
    console.log("HTTP Server listening on port " + http2.address().port)
});

// Below serves the public directory over https
app.use('/public', [privateAuth, express.static('public')])

//note - these two currently don't enforce auth key:
app.use('/dashboard', express.static('dashboard'))

publicApp.use('/videos', express.static('videos'))

publicApp.use('/pages', express.static('htmlPages'))

