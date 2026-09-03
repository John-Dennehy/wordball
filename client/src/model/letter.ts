import { letterGroups, LetterColours } from './config';
import { LetterGroupKey } from '../types/game';

export default class Letter {
  public character: string;
  public score: number;
  public colour: string;

  constructor(character: string = 'A') {
    this.character = character;
    this.score = this.getScore(character);
    this.colour = this.getColour(character);
  }

  getScore(letter: string = this.character): number {
    const upper = letter.toUpperCase();
    for (const key in letterGroups) {
      if (key.includes(upper)) {
        return letterGroups[key as LetterGroupKey];
      }
    }
    return 1;
  }

  getColour(letter: string = this.character): string {
    const upper = letter.toUpperCase();
    for (const key in LetterColours) {
      if (key.includes(upper)) {
        return LetterColours[key as LetterGroupKey];
      }
    }
    return '#03fca1';
  }
}
