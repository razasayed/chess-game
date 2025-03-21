const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const { nanoid } = require('nanoid/non-secure');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store games in memory
const games = {};

// Helper function to get the last move from a game's history
const getLastMoveFromHistory = (game) => {
  const history = game.history({ verbose: true });
  return history.length > 0 ? {
    from: history[history.length - 1].from,
    to: history[history.length - 1].to
  } : null;
};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Log all active games
    console.log('Active games:', Object.keys(games));

    // Create a new game
    socket.on('createGame', () => {
      const gameId = nanoid(8);
      games[gameId] = {
        id: gameId,
        players: [socket.id],
        game: new Chess(),
        createdAt: Date.now()
      };

      socket.join(gameId);
      socket.emit('gameCreated', { gameId });
      console.log(`Game created: ${gameId}`);
      console.log('Active games:', Object.keys(games));
    });

    // Join an existing game
    socket.on('joinGame', ({ gameId }) => {
      console.log(`Player ${socket.id} attempting to join game: ${gameId}`);
      console.log('Available games:', Object.keys(games));
      
      const game = games[gameId];
      
      if (!game) {
        console.log(`Game not found: ${gameId}`);
        socket.emit('gameError', { message: 'Game not found' });
        return;
      }

      // If player is already in the game, just rejoin
      if (game.players.includes(socket.id)) {
        socket.join(gameId);
        
        // Get the last move from the game history
        const lastMove = getLastMoveFromHistory(game.game);
        
        socket.emit('gameJoined', { 
          gameId,
          fen: game.game.fen(),
          lastMove
        });
        console.log(`Player ${socket.id} rejoined game: ${gameId}`);
        return;
      }

      if (game.players.length >= 2) {
        console.log(`Game is full: ${gameId}`);
        socket.emit('gameError', { message: 'Game is full' });
        return;
      }

      game.players.push(socket.id);
      socket.join(gameId);
      
      // Get the last move from the game history
      const lastMove = getLastMoveFromHistory(game.game);
      
      socket.emit('gameJoined', { 
        gameId,
        fen: game.game.fen(),
        lastMove
      });
      socket.to(gameId).emit('opponentJoined', { gameId });
      
      console.log(`Player ${socket.id} joined game: ${gameId}`);
    });

    // Make a move
    socket.on('makeMove', ({ gameId, move, fen }) => {
      console.log(`Received move for game ${gameId}:`, move);
      
      const game = games[gameId];
      
      if (!game) {
        console.log(`Game not found: ${gameId}`);
        socket.emit('gameError', { message: 'Game not found' });
        return;
      }
      
      try {
        // Update the game state
        game.game = new Chess(fen);
        
        // Broadcast the move to all players in the game
        io.to(gameId).emit('moveMade', { 
          fen,
          lastMove: {
            from: move.from,
            to: move.to
          }
        });
        
        console.log(`Move made in game ${gameId}: ${move.from} to ${move.to}`);
      } catch (error) {
        console.error('Error making move:', error);
        socket.emit('gameError', { message: 'Invalid move' });
      }
    });

    // Reset game
    socket.on('resetGame', ({ gameId }) => {
      console.log(`Resetting game: ${gameId}`);
      
      const game = games[gameId];
      
      if (!game) {
        console.log(`Game not found for reset: ${gameId}`);
        // Don't send an error, just log it
        return;
      }

      // Notify all players in the room before removing the game
      io.to(gameId).emit('gameReset', { gameId });
      
      // Remove the game
      delete games[gameId];
      
      console.log(`Game ${gameId} has been reset`);
      console.log('Active games after reset:', Object.keys(games));
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      // Find games where this player was participating
      Object.keys(games).forEach(gameId => {
        const game = games[gameId];
        
        if (game && game.players.includes(socket.id)) {
          // Notify other players
          socket.to(gameId).emit('opponentDisconnected');
          
          // Remove the game if it's not being played
          if (game.players.length <= 1) {
            delete games[gameId];
            console.log(`Game removed: ${gameId}`);
          } else {
            // Remove the player from the game
            game.players = game.players.filter(id => id !== socket.id);
          }
        }
      });
    });
  });

  // Clean up old games periodically (every hour)
  setInterval(() => {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    
    Object.keys(games).forEach(gameId => {
      const game = games[gameId];
      if (now - game.createdAt > ONE_HOUR) {
        delete games[gameId];
        console.log(`Removed old game: ${gameId}`);
      }
    });
  }, 60 * 60 * 1000);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
}); 