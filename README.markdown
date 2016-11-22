# Still Server

This is the server-side code for the Still show.

It is an express node.js app with image file uploading handled by multer. We also have websockets courtesy of ws. All dependencies are in the package.json.

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

## Commands

The server will be used by two classes of user: the audience and QLab. QLab will communicate with the server primarily to send messages to connected clients over websockets. Both the audience and QLab will be able to upload images.

### QLab

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
