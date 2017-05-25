const http = require('http')
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

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('Hello World  <img src="./snapshot.jpg" />\n');
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
