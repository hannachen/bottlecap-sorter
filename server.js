const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const Raspi = require('raspi-io')
const five = require('johnny-five')
const spawn = require('child_process').spawn
// const RaspiCam = require('raspicam')
const gm = require('gm')

const hostname = '0.0.0.0' // listen on all ports
const port = 80

const servoMin = -30
const servoMax = 180

/*
var camera = new RaspiCam({
  mode: 'photo',
  output: 'snapshots/snapshot.jpg',
  timeout: 0,
  timelapse: 0
})
*/

//get the list of jpg files in the image dir
function getImages(imageDir, callback) {
  var fileType = '.jpg',
      files = [], i
  fs.readdir(imageDir, function (err, list) {
    for(i=0; i<list.length; i++) {
      if(path.extname(list[i]) === fileType) {
        files.push(list[i]); //store the file name into the array files
      }
    }
    callback(err, files)
  })
}

var imageDir = '/var/www/camera/snapshots/'
http.createServer((req, res) => {
  //use the url to parse the requested url and get the image name
  var query = url.parse(req.url,true).query
  var pic = query.image

  if (typeof pic === 'undefined') {
    getImages(imageDir, function (err, files) {
      var imageLists = '<ul>'
      for (var i=0; i<files.length; i++) {
        imageLists += '<li><a href="/?image=' + files[i] + '">' + files[i] + '</li>'
      }
      imageLists += '</ul>'
      res.writeHead(200, {'Content-type':'text/html'})
      res.end(imageLists)
    });
  } else {
    //read the image using fs and send the image content back in the response
    fs.readFile(imageDir + pic, function (err, content) {
      if (err) {
        res.writeHead(400, {'Content-type':'text/html'})
        console.log(err)
        res.end("No such image")
      } else {
        //specify the content type in the response will be an image
        res.writeHead(200, {'Content-type':'image/jpg'})
        res.end(content)
      }
    });
  }

}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})

const board = new five.Board({
  io: new Raspi(),
  repl: false
})

board.on('ready', () => {
  // Create servo on pin 1 (GPIO18) on P1
  var servo = new five.Servo({
    pin: 1,
    range: [servoMin, servoMax],
    center: true
  })
  servo.center()

  var relay = new five.Relay({
    pin: 22
  });
  
  var button = new five.Button({
    pin: 25,
    isPullup: true
  })

  button.on('up', function() {
    relay.off()
    console.log('button up')
  })

  button.on('down', function() {
    relay.on()
    console.log('button down')
  })

  var button2 = new five.Button({
    pin: 4,
    isPullup: true
  })

  var toggle = false
  button2.on('up', function() {
    if (toggle) {
      servo.to(servoMin)
      console.log(`Servo to ${servoMin}`)
    } else {
      servo.to(servoMax)
      console.log(`Servo to ${servoMax}`)
    }
    toggle = !toggle
    console.log('button2 up')
  })

  button2.on('down', function() {
    console.log('button2', toggle)
  })

  var button3 = new five.Button({
    pin: 27,
    isPullup: true
  })

  /*
  camera.on('read', function(err, filename) {
    //do stuff
    console.log(`snapshot ${filename} saved...`)
    camera.stop()
  });
  */

  var process
  const cmd = 'raspistill'
  const snapshotPath = `${imageDir}snapshot.jpg`
  const args = ['-t', 1000, '-tl', 0, '-vf', '-hf', '-o', snapshotPath, '-w', 1640, '-h', 1232, '-q', 75]

  function execute(command, options, callback) {
    exec(command, options, function(error, stdout, stderr) {
      if (typeof callback === 'function') {
        callback(stdout)
      }
    })
  }

  button3.on('down', function() {
    // Always stop running camera task
    if (process) {
      process.stdin.pause()
      process.kill()
      process = undefined
    }
  })

  button3.on('up', function() {
    console.log(`button 3 up, taking photo using command ${cmd} ${args.join(' ')}`)
    // camera.start()
    relay.on()
    process = spawn(cmd, args)
    process.on('exit', function() {
      relay.off()
      console.log(`image saved at ${snapshotPath}`)
      gm(snapshotPath)
        .crop(520, 520, 560, 680)
	.noProfile()
	.write(`${imageDir}snapshot-resized.jpg`, function (err) {
          if (!err) console.log('done')
	})
    })
  })

});
