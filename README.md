# Chess Game

A simple two-player chess game that allows players to join via auto-generated URLs.

## Features

- Real-time multiplayer chess game
- Auto-generated URLs for inviting opponents
- Game state tracking (checkmate, draw, etc.)
- Visual indication of valid moves
- Responsive design

## Technologies Used

- Next.js
- React
- TypeScript
- Socket.IO
- chess.js (for chess logic)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/chess-game.git
cd chess-game
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Start the development server

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Play

1. Open the application in your browser
2. Click "Create New Game"
3. Share the generated URL with your opponent
4. When your opponent joins, the game will start automatically
5. White moves first
6. The game will indicate when there's a checkmate or draw

## License

ISC
