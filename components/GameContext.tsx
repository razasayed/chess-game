import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Chess } from 'chess.js';
import { io, Socket } from 'socket.io-client';

interface GameContextProps {
  game: Chess;
  gameId: string | null;
  playerColor: 'w' | 'b';
  isPlayerTurn: boolean;
  gameStatus: string;
  opponent: boolean;
  createGame: () => Promise<string>;
  joinGame: (id: string) => void;
  makeMove: (move: { from: string; to: string; promotion?: string }) => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<Chess>(new Chess());
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [opponent, setOpponent] = useState(false);
  const [gameStatus, setGameStatus] = useState('Waiting for opponent...');

  useEffect(() => {
    // Initialize socket connection
    console.log('Connecting to socket...');
    const socketInstance = io({
      transports: ['websocket', 'polling'],
      // Use the current host in production, localhost in development
      ...(process.env.NODE_ENV === 'production' ? {} : { path: '/socket.io' })
    });
    
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      console.log('Disconnecting socket...');
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('gameCreated', (data: { gameId: string }) => {
      console.log('Game created:', data.gameId);
      // Reset the game state first
      setGame(new Chess());
      setOpponent(false);
      // Then set the new game ID
      setGameId(data.gameId);
      setPlayerColor('w');
      setGameStatus('Waiting for opponent...');
    });

    socket.on('gameJoined', () => {
      console.log('Game joined');
      setOpponent(true);
      setGameStatus('Game started. White to move.');
    });

    socket.on('opponentJoined', () => {
      console.log('Opponent joined');
      setOpponent(true);
      setGameStatus('Game started. White to move.');
    });

    socket.on('moveMade', (data: { fen: string }) => {
      console.log('Move made, new FEN:', data.fen);
      const newGame = new Chess(data.fen);
      setGame(newGame);
      updateGameStatus(newGame);
    });

    socket.on('gameError', (data: { message: string }) => {
      console.error('Game error:', data.message);
      setGameStatus(`Error: ${data.message}`);
    });

    socket.on('opponentDisconnected', () => {
      console.log('Opponent disconnected');
      setGameStatus('Opponent disconnected. Game ended.');
    });

    socket.on('gameReset', (data: { gameId: string }) => {
      console.log('Game has been reset by server:', data?.gameId);
      // Only reset if this is our current game
      if (gameId === data?.gameId) {
        console.log('Resetting local game state');
        // No need to reset the game state here as it will be done when joining the new game
      }
    });

    return () => {
      socket.off('gameCreated');
      socket.off('gameJoined');
      socket.off('opponentJoined');
      socket.off('moveMade');
      socket.off('gameError');
      socket.off('opponentDisconnected');
      socket.off('gameReset');
    };
  }, [socket, gameId]);

  const updateGameStatus = (currentGame: Chess) => {
    if (currentGame.isGameOver()) {
      if (currentGame.isCheckmate()) {
        const winner = currentGame.turn() === 'w' ? 'Black' : 'White';
        setGameStatus(`Checkmate! ${winner} wins!`);
      } else if (currentGame.isDraw()) {
        let reason = 'Draw';
        if (currentGame.isStalemate()) {
          reason = 'Stalemate';
        } else if (currentGame.isThreefoldRepetition()) {
          reason = 'Threefold Repetition';
        } else if (currentGame.isInsufficientMaterial()) {
          reason = 'Insufficient Material';
        }
        setGameStatus(`Game Over - ${reason}`);
      }
    } else {
      const turn = currentGame.turn() === 'w' ? 'White' : 'Black';
      setGameStatus(`${turn} to move${currentGame.isCheck() ? ' (Check)' : ''}`);
    }
  };

  const createGame = async (): Promise<string> => {
    if (!socket) throw new Error('Socket not connected');
    
    console.log('Creating game...');
    return new Promise((resolve) => {
      socket.emit('createGame');
      socket.once('gameCreated', (data: { gameId: string }) => {
        console.log('Game created with ID:', data.gameId);
        resolve(data.gameId);
      });
    });
  };

  const joinGame = (id: string) => {
    if (!socket) return;
    
    console.log('Joining game:', id);
    socket.emit('joinGame', { gameId: id });
    setGameId(id);
    setPlayerColor('b');
  };

  const makeMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!socket || !gameId) {
      console.error('Cannot make move: socket or gameId is missing');
      return;
    }
    
    if (game.turn() !== playerColor) {
      console.error('Cannot make move: not your turn');
      return;
    }

    try {
      console.log('Making move:', move);
      const newGame = new Chess(game.fen());
      newGame.move(move);
      
      // Update local game state
      setGame(newGame);
      
      // Send move to server
      socket.emit('makeMove', {
        gameId,
        move,
        fen: newGame.fen()
      });
      
      updateGameStatus(newGame);
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const resetGame = () => {
    if (!socket || !gameId) return;
    
    console.log('Resetting game...');
    
    // Store the current gameId before clearing it
    const currentGameId = gameId;
    
    // First create a new game, then reset the old one
    // This ensures we have a new game ID before removing the old one
    createGame()
      .then(newGameId => {
        console.log('New game created after reset:', newGameId);
        
        // Now that we have a new game, reset the old one
        socket.emit('resetGame', { gameId: currentGameId });
      })
      .catch(error => {
        console.error('Error creating new game after reset:', error);
        setGameStatus('Error creating new game. Please try again.');
      });
  };

  // Determine if it's the player's turn
  const isPlayerTurn = game.turn() === playerColor;

  const value = {
    game,
    gameId,
    playerColor,
    isPlayerTurn,
    gameStatus,
    opponent,
    createGame,
    joinGame,
    makeMove,
    resetGame
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextProps => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export default GameContext; 