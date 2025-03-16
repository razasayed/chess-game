import React, { useState, useEffect, useRef } from 'react';
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
  const [boardWidth, setBoardWidth] = useState(500); // Increased default size for desktop
  const boardContainerRef = useRef<HTMLDivElement>(null);

  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      if (boardContainerRef.current) {
        const containerWidth = boardContainerRef.current.offsetWidth;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // For mobile (under 480px)
        if (windowWidth < 480) {
          setBoardWidth(Math.min(containerWidth * 0.95, 320));
        } 
        // For small tablets (480px - 768px)
        else if (windowWidth < 768) {
          setBoardWidth(Math.min(containerWidth * 0.9, 450));
        } 
        // For tablets (768px - 1024px)
        else if (windowWidth < 1024) {
          setBoardWidth(Math.min(containerWidth * 0.8, 500));
        } 
        // For desktop (1024px and above)
        else {
          // Make sure the board doesn't take up too much vertical space
          const maxHeight = windowHeight * 0.7; // Max 70% of viewport height
          const idealWidth = Math.min(containerWidth, 600); // Increased size for desktop
          const finalWidth = Math.min(idealWidth, maxHeight);
          setBoardWidth(finalWidth);
        }
      }
    };

    // Initial sizing
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    <div className="chessboard-container" ref={boardContainerRef}>
      <div style={{ width: `${boardWidth}px`, maxWidth: '100%', margin: '0 auto' }}>
        <Chessboard
          id="chess-board"
          position={game.fen()}
          onPieceDrop={handlePieceDrop}
          onPieceDragBegin={handlePieceDragBegin}
          onPieceDragEnd={handlePieceDragEnd}
          boardOrientation={playerColor === 'w' ? 'white' : 'black'}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            opacity: isPlayerTurn ? '1' : '0.9'
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