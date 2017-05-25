const http = require('http');
const Raspi = require('raspi-io');
const five = require('johnny-five');
const NodeWebcam = require('node-webcam');

const hostname = '0.0.0.0'; // listen on all ports
const port = 80;

var opts = {
  //Picture related
  width: 1280,
  height: 720,
  quality: 100,

  //Delay to take shot
  delay: 0,

  //Save shots in memory
  saveShots: true,

  // [jpeg, png] support varies
  // Webcam.OutputTypes
  output: "jpeg",

  //Which camera to use
  //Use Webcam.list() for results
  //false for default device
  device: false,

  // [location, buffer, base64]
  // Webcam.CallbackReturnTypes
  callbackReturn: "location",

  //Logging
  verbose: false
}

var Webcam = NodeWebcam.create(opts);
Webcam.capture('test_picture', function(err, data) {
  console.log(err)
  console.log(data)
});

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
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
