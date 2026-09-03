export default class Seed {
  public word: string;
  public value: number;

  constructor(word: string) {
    this.word = word;
    this.value = this.getValue();
  }

  getValue(): number {
    const array: number[] = [];
    const wordArray = this.word.split('');
    wordArray.forEach(letter => {
      array.push(letter.charCodeAt(0));
    });
    return Number(array.join(''));
  }
}
