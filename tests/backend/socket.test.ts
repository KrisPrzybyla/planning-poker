import { Server } from 'socket.io'
import { createServer } from 'http'
import { io as Client, Socket as ClientSocket } from 'socket.io-client'

describe('Socket.IO Server', () => {
  let httpServer: any
  let io: Server
  let clientSocket: ClientSocket
  let port: number

  beforeAll((done) => {
    httpServer = createServer()
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    })

    // Store rooms in memory (same as server)
    const rooms = new Map()

    // Generate a random 6-character room code
    function generateRoomCode() {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      return result
    }

    // Check if room code is unique
    function isRoomCodeUnique(code: string) {
      return !rooms.has(code)
    }

    // Create a new room code
    function createUniqueRoomCode() {
      let code
      do {
        code = generateRoomCode()
      } while (!isRoomCodeUnique(code))
      return code
    }

    // Simplified server logic for testing
    io.on('connection', (socket) => {
      socket.on('createRoom', ({ userName }, callback) => {
        const roomId = createUniqueRoomCode()
        const userId = 'test-user-id'
        
        const user = {
          id: userId,
          name: userName,
          role: 'Scrum Master',
          roomId,
          isConnected: true,
        }

        const room = {
          id: roomId,
          users: [user],
          currentStory: null,
          isVotingActive: false,
          isResultsVisible: false,
          votingCount: 0,
        }

        rooms.set(roomId, room)
        socket.join(roomId)
        socket.data = { userId, roomId }

        callback({ success: true, roomId, user })
        io.to(roomId).emit('roomUpdated', room)
      })

      socket.on('joinRoom', ({ roomId, userName }, callback) => {
        if (!rooms.has(roomId)) {
          callback({ success: false, error: 'Room not found' })
          return
        }

        const room = rooms.get(roomId)
        const userId = 'test-user-id-2'

        const user = {
          id: userId,
          name: userName,
          role: 'Participant',
          roomId,
          isConnected: true,
        }

        room.users.push(user)
        socket.join(roomId)
        socket.data = { userId, roomId }

        callback({ success: true, user })
        io.to(roomId).emit('roomUpdated', room)
      })

      socket.on('startVoting', ({ roomId, story }) => {
        if (!rooms.has(roomId)) return
        
        const room = rooms.get(roomId)
        room.currentStory = {
          id: 'test-story-id',
          title: story.title,
          description: story.description || '',
          votes: [],
        }
        room.isVotingActive = true
        room.isResultsVisible = false

        io.to(roomId).emit('roomUpdated', room)
      })

      socket.on('submitVote', ({ roomId, userId, value }) => {
        if (!rooms.has(roomId)) return
        
        const room = rooms.get(roomId)
        if (!room.currentStory) return

        room.currentStory.votes = room.currentStory.votes.filter((v: any) => v.userId !== userId)
        room.currentStory.votes.push({ userId, value })

        io.to(roomId).emit('roomUpdated', room)
      })

      socket.on('revealResults', ({ roomId }) => {
        if (!rooms.has(roomId)) return
        
        const room = rooms.get(roomId)
        room.isResultsVisible = true

        io.to(roomId).emit('roomUpdated', room)
      })

      socket.on('removeUser', ({ roomId, userIdToRemove }, callback) => {
        if (!rooms.has(roomId)) {
          callback({ success: false, error: 'Room not found' })
          return
        }

        const room = rooms.get(roomId)
        const requestingUserId = socket.data?.userId
        const requestingUser = room.users.find((u: any) => u.id === requestingUserId)
        
        if (!requestingUser || requestingUser.role !== 'Scrum Master') {
          callback({ success: false, error: 'Only Scrum Master can remove users' })
          return
        }

        const userIndex = room.users.findIndex((u: any) => u.id === userIdToRemove)
        if (userIndex === -1) {
          callback({ success: false, error: 'User not found' })
          return
        }

        room.users.splice(userIndex, 1)
        callback({ success: true })
        io.to(roomId).emit('roomUpdated', room)
      })
    })

    httpServer.listen(() => {
      port = (httpServer.address() as any).port
      clientSocket = Client(`http://localhost:${port}`)
      clientSocket.on('connect', done)
    })
  })

  afterAll(() => {
    io.close()
    clientSocket.close()
    httpServer.close()
  })

  describe('Room Management', () => {
    it('should create a new room', (done) => {
      clientSocket.emit('createRoom', { userName: 'Test User' }, (response: any) => {
        expect(response.success).toBe(true)
        expect(response.roomId).toBeDefined()
        expect(response.user).toBeDefined()
        expect(response.user.name).toBe('Test User')
        expect(response.user.role).toBe('Scrum Master')
        done()
      })
    })

    it('should join an existing room', (done) => {
      clientSocket.emit('createRoom', { userName: 'Creator' }, (createResponse: any) => {
        const roomId = createResponse.roomId
        
        const secondClient = Client(`http://localhost:${port}`)
        secondClient.emit('joinRoom', { roomId, userName: 'Joiner' }, (joinResponse: any) => {
          expect(joinResponse.success).toBe(true)
          expect(joinResponse.user.name).toBe('Joiner')
          expect(joinResponse.user.role).toBe('Participant')
          secondClient.close()
          done()
        })
      })
    })

    it('should handle room not found error', (done) => {
      clientSocket.emit('joinRoom', { roomId: 'INVALID', userName: 'Test User' }, (response: any) => {
        expect(response.success).toBe(false)
        expect(response.error).toBe('Room not found')
        done()
      })
    })
  })

  describe('Voting System', () => {
    let roomId: string

    beforeEach((done) => {
      clientSocket.emit('createRoom', { userName: 'Scrum Master' }, (response: any) => {
        roomId = response.roomId
        done()
      })
    })

    it('should start voting session', (done) => {
      const story = { title: 'Test Story', description: 'Test Description' }
      
      clientSocket.on('roomUpdated', (room: any) => {
        if (room.isVotingActive && room.currentStory) {
          expect(room.currentStory.title).toBe('Test Story')
          expect(room.isVotingActive).toBe(true)
          done()
        }
      })

      clientSocket.emit('startVoting', { roomId, story })
    })

    it('should submit a vote', (done) => {
      const story = { title: 'Test Story' }
      
      clientSocket.emit('startVoting', { roomId, story })
      
      clientSocket.on('roomUpdated', (room: any) => {
        if (room.currentStory && room.currentStory.votes.length > 0) {
          expect(room.currentStory.votes[0].value).toBe('5')
          done()
        }
      })

      setTimeout(() => {
        clientSocket.emit('submitVote', { 
          roomId, 
          userId: 'test-user-id', 
          value: '5' 
        })
      }, 100)
    })

    it('should reveal voting results', (done) => {
      const story = { title: 'Test Story' }
      
      clientSocket.emit('startVoting', { roomId, story })
      
      clientSocket.on('roomUpdated', (room: any) => {
        if (room.isResultsVisible) {
          expect(room.isResultsVisible).toBe(true)
          done()
        }
      })

      setTimeout(() => {
        clientSocket.emit('revealResults', { roomId })
      }, 100)
    })
  })

  describe('Scrum Master Controls', () => {
    let roomId: string

    beforeEach((done) => {
      clientSocket.emit('createRoom', { userName: 'Scrum Master' }, (response: any) => {
        roomId = response.roomId
        done()
      })
    })

    it('should allow scrum master to remove users', (done) => {
      // First add a user to remove
      const secondClient = Client(`http://localhost:${port}`)
      secondClient.emit('joinRoom', { roomId, userName: 'User to Remove' }, (joinResponse: any) => {
        const userIdToRemove = joinResponse.user.id
        
        clientSocket.emit('removeUser', { roomId, userIdToRemove }, (response: any) => {
          expect(response.success).toBe(true)
          secondClient.close()
          done()
        })
      })
    })

    it('should prevent non-scrum masters from removing users', (done) => {
      const secondClient = Client(`http://localhost:${port}`)
      secondClient.emit('joinRoom', { roomId, userName: 'Regular User' }, () => {
        secondClient.emit('removeUser', { roomId, userIdToRemove: 'some-id' }, (response: any) => {
          expect(response.success).toBe(false)
          expect(response.error).toBe('Only Scrum Master can remove users')
          secondClient.close()
          done()
        })
      })
    })
  })
})