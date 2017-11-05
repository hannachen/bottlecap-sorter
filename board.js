const Raspi = require('raspi-io')
const five = require('johnny-five')
const spawn = require('child_process').spawn
const exec = require('child_process').exec
const gm = require('gm')

const servoMin = -30
const servoMax = 180

const baseDir = '/var/www/camera/'
const imageDir = `${baseDir}snapshots/`
const snapshotPath = `${imageDir}snapshot.png`
const snapshotCmd = 'raspistill'
const snapshotArgs = ['-t', 300, '-tl', 0, '-ex', 'sports', '-awb', 'flash', '-vf', '-hf', '-o', snapshotPath, '-w', 1640, '-h', 1232, '-q', 75]

module.exports = class Board {

  constructor() {
    console.log('board init')

    this.busy = false
    this.onSnapshot = this.onSnapshot.bind(this)
    this.onSaveImage = this.onSaveImage.bind(this)
    this.initIo = this.initIo.bind(this)
    this.initIoEvents = this.initIoEvents.bind(this)
    this.init = this.init.bind(this)
    this.stopRunningProcess = this.stopRunningProcess.bind(this)
    this.resetServo = this.resetServo.bind(this)
    this.acceptCap = this.acceptCap.bind(this)
    this.rejectCap = this.rejectCap.bind(this)
    this.reset = this.reset.bind(this)
  }

  resetServo() {
    setTimeout(this.reset, 500)
  }

  acceptCap() {
    this.servo.to(servoMin)
    this.resetServo()
  }

  rejectCap() {
    this.servo.to(servoMax)
    this.resetServo()
  }

  reset() {
    this.servo.center()
  }

  onSnapshot() {
    this.light.off()
    console.log(`image saved at ${snapshotPath}`)
    gm(snapshotPath)
      .crop(520, 520, 525, 565) // Crop from bottom right due to flipped snapshot (both h/v)
      .modulate(110, 150) // brightness/saturation/hue
      .contrast(-5)
      .noProfile()
      .write(`${snapshotPath}`, this.onSaveImage)
  }

  onSaveImage(err) {
    if (err) { return }
    console.log(`image cropped`)
    const mask = `${baseDir}bottlecap-mask.png`
    var _this = this
    this.gmCompositeMask(snapshotPath, mask, () => {
      console.log('image masked')
      _this.busy = false
    })
  }

  takePhoto() {
    if (this.busy) { return }
    this.busy = true
    this.light.on()
    this.process = spawn(snapshotCmd, snapshotArgs)
    this.process.on('exit', this.onSnapshot)
  }

  gmCompositeMask(thumb, mask, next) {
    var gmComposite = 'gm composite -compose in ' + thumb + ' ' + mask + ' ' + thumb
    exec(gmComposite, (err) => {
      if (err) throw err
      next()
    })
  }

  initIoEvents() {
    this.button.on('up', () => {
      this.light.off()
      console.log('button up')
    })

    this.button.on('down', () => {
      this.light.on()
      console.log('button down')
    })

    var toggle = false
    this.button2.on('up', () => {
      if (toggle) {
        this.servo.to(servoMin)
        console.log(`Servo to ${servoMin}`)
      } else {
        this.servo.to(servoMax)
        console.log(`Servo to ${servoMax}`)
      }
      toggle = !toggle
      console.log('button2 up')
    })

    this.button2.on('down', () => {
      console.log('button2', toggle)
    })

    this.button3.on('down', this.stopRunningProcess)

    var _this = this
    this.button3.on('up', () => {
      console.log(`button 3 up, taking photo using command ${snapshotCmd} ${snapshotArgs.join(' ')}`)
      _this.takePhoto()
    })
  }

  initIo(cb) {
    // Create servo on pin 1 (GPIO18) on P1
    this.servo = new five.Servo({
      pin: 1,
      range: [servoMin, servoMax],
      center: true
    })

    this.light = new five.Relay({
      pin: 22
    })

    this.button = new five.Button({
      pin: 27,
      isPullup: true
    })

    this.button2 = new five.Button({
      pin: 25,
      isPullup: true
    })

    this.button3 = new five.Button({
      pin: 4,
      isPullup: true
    })

    this.servo.center()
    this.initIoEvents()
    console.log('board ready')

    // Start server here
    cb.call()
  }

  init(cb=()=>{}) {
    console.log('init...')
    this.board = new five.Board({
      io: new Raspi(),
      repl: false
    })
    var _this = this
    this.board.on('ready', () => {
      _this.initIo(cb)
    })
  }

  stopRunningProcess() {
    // Stop running tasks
    if (this.process) {
      this.process.stdin.pause()
      this.process.kill()
      this.process = undefined
    }
  }
}