export default class Hole {
  public xPos: number;
  public yPos: number;
  public score: number;
  public radius: number;

  constructor(x: number, y: number, score: number, radius: number) {
    this.xPos = x;
    this.yPos = y;
    this.score = score;
    this.radius = radius;
  }
}
