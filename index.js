const Board = require('./board')
const Server = require('./server')

class Index {

  constructor() {
    this.init()
  }

  init() {
    let board = new Board()
    let server = new Server()
    board.init(() => {
      server.init(board)
      server.on('snapshot', () => {
        console.log('SNAPSHOT')
        board.takePhoto()
      })
      server.on('accept', () => {
        board.acceptCap()
      })
      server.on('reject', () => {
        board.rejectCap()
      })
      server.on('reset', () => {
        board.reset()
      })
    })
  }
}

new Index()