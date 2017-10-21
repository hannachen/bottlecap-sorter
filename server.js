const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const http = require('http')
const url = require('url')

const hostname = '0.0.0.0' // listen on all ports
const port = 80
const imageDir = '/var/www/camera/snapshots/'

module.exports = class Server extends EventEmitter {

  constructor() {
    super()
    console.log('server init')

    this.init = this.init.bind(this)
  }

  // get the list of png files in the image dir
  getImages(imageDir, callback) {
    var fileType = '.png',
      files = [], i
    fs.readdir(imageDir, (err, list) => {
      for(i=0; i<list.length; i++) {
        if(path.extname(list[i]) === fileType) {
          files.push(list[i]) // store the file name into the array files
        }
      }
      callback(err, files)
    })
  }

  onServerStart() {
    console.log(`Server running at http://${hostname}:${port}/`)
  }

  init() {
    console.log('server start')

    // Start the server
    http.createServer((req, res) => {
      // use the url to parse the requested url and get the image name
      var query = url.parse(req.url,true).query
      var pic = query.image

      if (typeof pic === 'undefined') {
        let snapshot = query.snapshot
        let servoAction = query.servo
        if (snapshot) {
          console.info('snapshot')
          this.emit('snapshot')
        }
        if (servoAction) {
          console.info('servo action: ', servoAction)
          this.emit('servo.'+servoAction)
          switch(servoAction) {
            case 'accept':
              this.emit('accept')
              break
            case 'reject':
              this.emit('reject')
              break
            case 'center':
            case 'reset':
            default:
              this.emit('reset')
          }
        }
        // Default -- list image directory
        this.getImages(imageDir, (err, files) => {
          var imageLists = '<ul>'
          for (var i = 0; i < files.length; i++) {
            imageLists += '<li><a href="/?image=' + files[i] + '">' + files[i] + '</a></li>'
          }
          imageLists += '</ul>'
          var image = '<img src="/?image=snapshot.png" />'
          var snapshotLink = '<button data-action="/?snapshot=true">Take Snapshot</button>'
          var acceptButton = '<button data-action="/?servo=accept">Accept</button>'
          var rejectButton = '<button data-action="/?servo=reject">Reject</button>'
          var resetButton = '<button data-action="/?servo=reset">Reset</button>'
          res.writeHead(200, {'Content-type': 'text/html'})
          res.end(image + imageLists + snapshotLink + acceptButton + rejectButton + resetButton)
        })
      } else {
        // Read the image using fs and send the image content back in the response
        fs.readFile(imageDir + pic, (err, content) => {
          if (err) {
            res.writeHead(400, {'Content-type':'text/html'})
            console.log(err)
            res.end("No such image")
          } else {
            // Specify the content type in the response will be an image
            res.writeHead(200, {'Content-type':'image/png'})
            res.end(content)
          }
        })
      }

    }).listen(port, hostname, this.onServerStart)
  }
}