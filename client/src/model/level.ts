import { defaultHoleAttributes } from './config';
import Hole from './hole';
import Letter from './letter';
import Seed from './seed';

export default class Level {
  public seed: Seed;
  public totalLetters: number;
  public letters: Letter[];
  public holes: Hole[];

  constructor(seed: Seed, totalLetters: number) {
    this.seed = seed;
    this.totalLetters = totalLetters;
    this.letters = this.generateLetterArray();
    this.holes = this.generateHolesArray(defaultHoleAttributes);
  }

  generateHolesArray(holeValues: [number, number, number, number][]): Hole[] {
    const array: Hole[] = [];
    holeValues.forEach(holeValue => {
      const x = holeValue[0];
      const y = holeValue[1];
      const score = holeValue[2];
      const size = holeValue[3];
      const hole = new Hole(x, y, score, size);
      array.push(hole);
    });
    return array;
  }

  generateLetterArray(): Letter[] {
    const ALPHABET = 'AAABCDDEEEFGHIJKLLMNOOPQRRSSTTUUVWXYYZ';
    const seedNumber = this.seed;
    const lettersArray = this.getRandomLetterCodes(seedNumber).map((n) => {
      return ALPHABET[n];
    });

    return lettersArray.map((character) => {
      return new Letter(character);
    });
  }

  getRandomLetterCodes(seed: Seed): number[] {
    let seedNumber = seed.value;
    const randomNumbers: number[] = [];
    for (let i = 0; i < this.totalLetters; i++) {
      seedNumber = (seedNumber * 9301 + 49297) % 233280;
      const rnd = seedNumber / 233280;
      randomNumbers.push(Math.floor(0 + rnd * (31 - 0)));
    }
    return randomNumbers;
  }
}
