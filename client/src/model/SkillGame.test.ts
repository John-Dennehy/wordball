import { vi, it, expect } from 'vitest';
import SkillGame from './SkillGame';
import Ball from './ball';
import Hole from './hole';

vi.mock('./ball', () => {
  return {
    default: class MockBall {
      public isDone: boolean;
      public xPos: number;
      public yPos: number;
      public radius: number;
      public score: number;
      public letter: string;
      public colour: string;
      constructor() {
        this.isDone = false;
        this.xPos = 0;
        this.yPos = 0;
        this.radius = 10;
        this.score = 1;
        this.letter = 't';
        this.colour = '#03fca1';
      }
      done(): void {
        this.isDone = true;
      }
    },
  };
});

const level = {
  letters: ['t', 'e', 's', 't'],
};

const letters = ['t', 'e', 's', 't'];

const game = new SkillGame(level);
letters.forEach(() => game.balls.push(new Ball(0, 0, 10, { character: 't', colour: '#03fca1', score: 1 })));

it('Has the right number of balls', () => {
  expect(game.balls.length).toBe(4);
});

it('Starts with score = 0', () => {
  expect(game.score).toBe(0);
});

it('Starts with word = []', () => {
  expect(game.word.length).toBe(0);
});

it('forces game over', () => {
  expect(game.isGameOver()).toBeFalsy();
  game.forceGameOver();
  expect(game.isGameOver()).toBeTruthy();
});

it('Starts with counter = 0', () => {
  const g = new SkillGame(level);
  letters.forEach(() => g.balls.push(new Ball(0, 0, 10, { character: 't', colour: '#03fca1', score: 1 })));
  expect(g.counter).toBe(0);
});

it('increase counter by 1', () => {
  const g = new SkillGame(level);
  letters.forEach(() => g.balls.push(new Ball(0, 0, 10, { character: 't', colour: '#03fca1', score: 1 })));
  g.increaseCounter();
  expect(g.counter).toBe(1);
});

it('returns a currentBall', () => {
  const g = new SkillGame(level);
  const b = new Ball(0, 0, 10, { character: 't', colour: '#03fca1', score: 1 });
  letters.forEach(() => g.balls.push(b));
  g.increaseCounter();
  expect(g.currentBall()).toBe(b);
});

it('tests if a ball is in abyss', () => {
  const g = new SkillGame(level);
  const b = new Ball(0, 0, 10, { character: 't', colour: '#03fca1', score: 1 });
  b.yPos = -100;
  b.xPos = 250;
  b.radius = 10;
  g.isBallInTheAbyss(b);
  expect(g.counter).toBe(1);
});

it('tests if a ball is in wordhole', () => {
  const g = new SkillGame(level);
  const b = new Ball(0, 0, 10, { character: 't', colour: '#03fca1', score: 1 });
  b.yPos = 820;
  b.xPos = 250;
  b.radius = 10;
  g.isBallinWordHole(b);
  expect(g.counter).toBe(1);
});

it('tests if a ball is in scorehole', () => {
  const g = new SkillGame(level);
  const b = new Ball(0, 0, 10, { character: 't', colour: '#03fca1', score: 1 });
  g.holeArray = [new Hole(100, 250, 10, 1)];
  b.yPos = 100;
  b.xPos = 250;
  b.radius = 10;
  g.isBallinScoreHole(b);
  expect(g.counter).toBe(0);
});
