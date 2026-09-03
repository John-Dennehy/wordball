# Wordball Xtreme 🎯🔤

> Makers Academy Final Project — Where brains and dexterity are tested equally!

A retro arcade hybrid of physics-based ball rolling and word anagram solving. Players aim and fire lettered balls into target holes to collect letters, earn score multipliers, and assemble valid high-scoring words before the timer runs out.

---

## 🛠️ Modernized Tech Stack

This project was originally built in 2019 using Create React App v1, Webpack 3, and Node 10. It has been modernized for contemporary JavaScript environments:

- **Frontend**: [React 18](https://react.dev/) + [Vite 6](https://vite.dev/) (instant HMR and sub-2-second production builds)
- **Styling**: [Bulma CSS](https://bulma.io/)
- **Backend API**: [Express](https://expressjs.com/) with async/await
- **Database**: [MongoDB](https://www.mongodb.com/) driver 6.x with an **automatic in-memory fallback**, allowing instant local play without configuring an external database cluster
- **Testing**: [Vitest](https://vitest.dev/) (29 unit tests covering physics engine, letter scoring, and game state)

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18 (Tested on Node 24)
- `pnpm` or `npm`

### Installation
```bash
# Install root & client dependencies
pnpm install
pnpm install --prefix client
```

### Development
Run both the Express backend API (port 5000) and Vite frontend (port 3000) concurrently:
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Running Tests
Run all 29 unit tests via Vitest:
```bash
pnpm test
```

### Production Build & Run
```bash
# Build the client bundle into client/build
pnpm build

# Run the Express server (serves the frontend on port 5000)
pnpm start
```

---

## 🎮 How to Play

1. **Aim & Launch**: Click and drag from a ball to set angle and power, then release to launch it towards the holes.
2. **Score Holes**: Land balls in higher-value score holes to multiply letter values.
3. **Word Assembly**: Collected letters are banked. Assemble valid English words to clear the stage and boost your final score!

---

## 📁 Architecture

```text
wordball/
├── client/
│   ├── src/
│   │   ├── App/          # React components, pages (Home, SkillGame, Scores)
│   │   ├── model/        # Physics engine (ball, collision, letters, holes)
│   │   └── style/        # Bulma and custom retro styles
│   ├── vite.config.js    # Vite configuration
│   └── test.setup.js     # Vitest global setup
├── server.js             # Express API & fallback leaderboard store
└── package.json          # Root scripts & orchestration
```
