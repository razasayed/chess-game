import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ChessboardJS from './ChessboardJS';
import { useGame } from './GameContext';

const Game: React.FC = () => {
  const router = useRouter();
  const { gameId: routeGameId } = router.query;
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  
  const {
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
  } = useGame();

  useEffect(() => {
    // If there's a gameId in the URL, join that game
    if (routeGameId && typeof routeGameId === 'string' && !gameId) {
      console.log('Joining game from URL:', routeGameId);
      joinGame(routeGameId);
    }
  }, [routeGameId, gameId, joinGame]);

  useEffect(() => {
    if (gameId) {
      const url = `${window.location.origin}?gameId=${gameId}`;
      setShareUrl(url);
    }
  }, [gameId]);

  const handleCreateGame = async () => {
    try {
      console.log('Creating new game...');
      const id = await createGame();
      console.log('Game created, ID:', id);
      router.push(`/?gameId=${id}`, undefined, { shallow: true });
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="game-container">
      <div className="game-info">
        <h1>Chess Game</h1>
        <div className="game-status">{gameStatus}</div>
        
        {!gameId && (
          <button className="button" onClick={handleCreateGame}>
            Create New Game
          </button>
        )}
        
        {gameId && !opponent && (
          <div>
            <p>Share this link with your opponent:</p>
            <div className="share-link">{shareUrl}</div>
            <button className="button" onClick={handleCopyLink}>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        )}
        
        {gameId && opponent && game.isGameOver() && (
          <button className="button" onClick={resetGame}>
            New Game
          </button>
        )}
      </div>
      
      <ChessboardJS
        game={game}
        playerColor={playerColor}
        isPlayerTurn={isPlayerTurn}
        onMove={makeMove}
      />
      
      {gameId && (
        <div className="player-info">
          <p>You are playing as {playerColor === 'w' ? 'White' : 'Black'}</p>
          {!opponent && <p>Waiting for opponent to join...</p>}
        </div>
      )}
    </div>
  );
};

export default Game; 