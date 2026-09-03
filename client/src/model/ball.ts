import Letter from './letter';

export interface LetterLike {
  character: string;
  colour: string;
  score: number;
}

export interface CanvasLike {
  width: number;
  height: number;
}

export default class Ball {
  public letter: string;
  public colour: string;
  public radius: number;
  public score: number;
  public xPos: number;
  public yPos: number;
  public xVel: number;
  public yVel: number;
  public cor: number;
  public dt: number;
  public isDone: boolean;
  public isClicked: boolean;
  public canvas: CanvasLike | HTMLCanvasElement | null;

  constructor(
    x: number | undefined,
    y: number,
    radius: number,
    letter: Letter | LetterLike,
    canvas: CanvasLike | HTMLCanvasElement | null = null
  ) {
    this.letter = letter.character;
    this.colour = letter.colour;
    this.radius = radius;
    this.score = letter.score;

    this.xPos = x !== undefined ? x : 100 + Math.floor(Math.random() * 300);
    this.yPos = y;

    this.xVel = 0;
    this.yVel = 0;
    this.cor = 0.5;
    this.dt = 0.1;
    this.isDone = false;
    this.isClicked = false;
    this.canvas = canvas;
  }

  giveVelocity(x1: number, y1: number, x2: number, y2: number): void {
    if (!this.isClicked) {
      const dy = y2 - y1;
      const dx = x2 - x1;
      this.xVel = dx * 1.8;
      this.yVel = dy * 1.8;
      this.isClicked = true;
    }
  }

  checkStill(): void {
    if (this.isClicked && this.speed() < 5) {
      this.isDone = true;
    }
  }

  speed(): number {
    return Math.sqrt(Math.pow(this.xVel, 2) + Math.pow(this.yVel, 2));
  }

  velocity(): void {
    this.xVel = this.xVel * 0.99;
    this.yVel = this.yVel * 0.99;
  }

  position(): void {
    this.detectCollision();
    this.velocity();
    this.checkStill();
    this.xPos += this.xVel * this.dt;
    this.yPos += this.yVel * this.dt;
  }

  done(): void {
    this.isDone = true;
  }

  detectCollision(): void {
    if (!this.canvas) return;
    if (this.canvas.width && this.xPos + this.radius > this.canvas.width) {
      this.xPos = this.canvas.width - this.radius;
      this.xVel = -this.xVel * this.cor;
    }
    if (this.canvas.width && this.xPos < this.radius) {
      this.xPos = this.radius;
      this.xVel = -this.xVel * this.cor;
    }
    if (this.canvas.height && this.yPos > this.canvas.height - this.radius) {
      this.yPos = this.canvas.height - this.radius;
      this.yVel = -this.yVel * this.cor;
    }
  }
}
