import React from 'react';
import Head from 'next/head';
import Game from '../components/Game';
import { GameProvider } from '../components/GameContext';

const Home: React.FC = () => {
  return (
    <div className="container">
      <Head>
        <title>Chess Game</title>
        <meta name="description" content="A simple two-player chess game" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <GameProvider>
          <Game />
        </GameProvider>
      </main>
    </div>
  );
};

export default Home; 