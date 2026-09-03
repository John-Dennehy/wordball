import Ball from './ball';
import Hole from './hole';
import Letter from './letter';
import Level from './level';

const MAX_WORDHOLE = 8;

export interface LevelLike {
  letters: Array<Letter | string>;
  holes?: Hole[];
}

export default class Game {
  public score: number;
  public balls: Ball[];
  public level: Level | LevelLike;
  public letters: Array<Letter | string>;
  public holeArray: Hole[];
  public counter: number;
  public word: string[];
  public bLeftCorner: [number, number];
  public bRightCorner: [number, number];
  public tLeftCorner: [number, number];
  public tRightCorner: [number, number];

  constructor(level: Level | LevelLike) {
    this.score = 0;
    this.balls = [];
    this.level = level;
    this.letters = level.letters;
    this.holeArray = level.holes || [];

    this.counter = 0;
    this.word = [];

    this.bLeftCorner = [100, 850];
    this.bRightCorner = [400, 850];
    this.tLeftCorner = [100, 800];
    this.tRightCorner = [400, 800];
  }

  forceGameOver(): void {
    this.counter = this.letters.length;
  }

  isGameOver(): boolean {
    return this.counter >= this.letters.length;
  }

  increaseCounter(): void {
    this.counter += 1;
  }

  checkBallDone(ball: Ball): void {
    if (ball.isDone) {
      this.increaseCounter();
    }
  }

  currentBall(): Ball | undefined {
    return this.balls[this.counter];
  }

  isBallinScoreHole(ball: Ball): void {
    this.holeArray.forEach((item) => {
      const x1 = item.xPos - item.radius;
      const x2 = item.xPos + item.radius;
      const y1 = item.yPos - item.radius;
      const y2 = item.yPos + item.radius;

      const x = ball.xPos;
      const y = ball.yPos;

      if (x > x1 && x < x2 && y > y1 && y < y2) {
        ball.done();
        this.increaseCounter();
        this.score += (ball.score * item.score);
      }
    });
  }

  isBallInTheAbyss(ball: Ball): void {
    if (ball.yPos < -ball.radius) {
      ball.done();
      this.increaseCounter();
    }
  }

  isBallinWordHole(ball: Ball): void {
    const x = ball.xPos;
    const y = ball.yPos;
    if (x > 100 && x < 400 && y > 800 && y < 850) {
      this.word.push(ball.letter);
      if (this.word.length === MAX_WORDHOLE) {
        this.forceGameOver();
      }
      ball.done();
      this.increaseCounter();
    }
  }
}
