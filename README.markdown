# Still Server

Still server is an express node.js app with image file uploading handled by multer. We also have websockets courtesy of ws. All dependencies are in the package.json.

Still Server is designed to work with the Still App (https://github.com/potentialdifference/still-app-2016). It was commissioned by Brighton based theatre company The Future Is Unwritten as part of their live theatre production "Still" and developed by Henry Garner and Russell Bender.

The Still App was offered to audiences to download before the performance and used during the performance. The app connects to this server. The app sends images to the server and responds to websocket commands from the server. You can see more details on its use during Still in the Still App repository.


## Usage

Ensure you have fetched dependencies with:

```bash
npm install
```

Then you can run the server with:

```bash
node server.js

# Server listening on port 8080
```

You will need to generate your own SSL certificate and private key and configure server.js to point to them. You may also want to change the authorization tokens defined in server.js

## Commands

The server will be used by two classes of user: the audience and QLab. QLab will communicate with the server primarily to send messages to connected clients over websockets. Both the audience and QLab will be able to upload images.

### QLab

Still Server can be used from QLab (https://figure53.com/qlab/) allowing instructions to be sent to the app alongside just like any other cue in QLab.

To do this, create a script cue and paste in the following content:

**Upload an image and broadcast to clients:**

```bash
curl -ik -H "Authorization: xyzasdf" https://localhost:8080/public -F image=@[path/to/image.jpg]
```

This has the effect of uploading an image to the public directory and telling all clients to use the new image.

**Broadcast an existing image to clients:**

```bash
curl -ik -H "Authorization: xyzasdf" -X PUT https://localhost:8080/broadcast/displayImage\?image\=[image.jpg]
```

This requires that `image.jpg` is already in the server's `public` directory.

**Hide an image on clients:**

```bash
curl -ik -H "Authorization: xyzasdf" -X PUT https://localhost:8080/broadcast/hideImage
```

**Exit the 'show mode':**

```bash
curl -ik -H "Authorization: xyzasdf" -X PUT https://localhost:8080/broadcast/exitShowMode
```

### Client

**Upload an image to the server's private directory:**

```bash
curl -ik -H "Authorization: abcdef" https://localhost:8080/private\?uid\=[uid]\&tag\=[tag] -F image=@[path/to/image.jpg]
```

Note that clients use a different authorization token.

  * uid: usually the email address of the user, but may be the device id
  * tag: tag is a short label such as 'front', 'rear', 'photo1', etc which helps identify the image

**View an image broadcast by QLab**

```bash
https://localhost:8080/public/[image.jpg]
```

This can be viewed in a browser or downloaded via https in the usual way.


Still ran at Ovalhouse in London and toured to the Mercury Theatre, Colchester and The Old Market Theatre, Brighton between November 2016 and March 2017. We don't envisage further contributing to this repository unless further development is required for future performances. If you would like to make pull requests, we'll do our best to review them. If you have any questions about the app, frameworks etc feel free to contact us: hello@potentialdifference.org.uk

##License
Copyright © 2016 Potential Difference

Distributed under the GPL Public License 2.0 
