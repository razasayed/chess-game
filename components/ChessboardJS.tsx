import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

interface ChessboardJSProps {
  game: Chess;
  playerColor: 'w' | 'b';
  isPlayerTurn: boolean;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
}

const ChessboardJS: React.FC<ChessboardJSProps> = ({ game, playerColor, isPlayerTurn, onMove }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handlePieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (!isPlayerTurn) {
      console.log('Not your turn');
      return false;
    }

    try {
      // Create a new game instance to validate the move
      const gameCopy = new Chess(game.fen());
      
      // Try to make the move
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });

      // If the move is invalid, return false
      if (move === null) {
        console.log('Invalid move');
        return false;
      }

      // If the move is valid, send it to the parent component
      console.log('Valid move:', move);
      onMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });
      
      return true;
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  };

  const handlePieceDragBegin = () => {
    setIsDragging(true);
  };

  const handlePieceDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="chessboard-container">
      <div style={{ width: '400px', margin: '0 auto' }}>
        <Chessboard
          id="chess-board"
          position={game.fen()}
          onPieceDrop={handlePieceDrop}
          onPieceDragBegin={handlePieceDragBegin}
          onPieceDragEnd={handlePieceDragEnd}
          boardOrientation={playerColor === 'w' ? 'white' : 'black'}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)'
          }}
          customDarkSquareStyle={{ backgroundColor: '#b58863' }}
          customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          showBoardNotation={true}
          arePiecesDraggable={isPlayerTurn}
          animationDuration={200}
        />
      </div>
    </div>
  );
};

export default ChessboardJS; 