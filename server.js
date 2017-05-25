const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
const Raspi = require('raspi-io')
const five = require('johnny-five')
const RaspiCam = require('raspicam')

const hostname = '0.0.0.0'; // listen on all ports
const port = 80;

var camera = new RaspiCam({
  mode: 'photo',
  output: 'images/snapshot.jpg'
})
camera.start()

//get the list of jpg files in the image dir
function getImages(imageDir, callback) {
  var fileType = '.jpg',
    files = [], i;
  fs.readdir(imageDir, function (err, list) {
    for(i=0; i<list.length; i++) {
      if(path.extname(list[i]) === fileType) {
        files.push(list[i]); //store the file name into the array files
      }
    }
    callback(err, files);
  });
}

var imageDir = '/var/www/camera/images/'
http.createServer((req, res) => {
  //use the url to parse the requested url and get the image name
  var query = url.parse(req.url,true).query;
  pic = query.image;

  if (typeof pic === 'undefined') {
    getImages(imageDir, function (err, files) {
      var imageLists = '<ul>';
      for (var i=0; i<files.length; i++) {
        imageLists += '<li><a href="/?image=' + files[i] + '">' + files[i] + '</li>';
      }
      imageLists += '</ul>';
      res.writeHead(200, {'Content-type':'text/html'});
      res.end(imageLists);
    });
  } else {
    //read the image using fs and send the image content back in the response
    fs.readFile(imageDir + pic, function (err, content) {
      if (err) {
        res.writeHead(400, {'Content-type':'text/html'})
        console.log(err);
        res.end("No such image");
      } else {
        //specify the content type in the response will be an image
        res.writeHead(200,{'Content-type':'image/jpg'});
        res.end(content);
      }
    });
  }

}).listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
})

const board = new five.Board({
  io: new Raspi(),
  repl: false
})

board.on('ready', () => {
  // Create servo on pin 1 (GPIO18) on P1
  var servo = five.Servo({
    pin: 1,
    center: true
  });
  var button = five.Button({
    pin: 25,
    isPullup: true
  });

  var toggle = false;
  button.on("up", function(value) {
    if (toggle) {
      servo.to(200);
    } else {
      servo.to(80);
    }
    toggle = !toggle;
  });
});
