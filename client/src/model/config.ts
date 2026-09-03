import { LetterGroupKey } from '../types/game';

export const MAX_LETTERS = 300;
export const DEFAULT_TIMER = 45;
export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 800;

export const letterGroups: Record<LetterGroupKey, number> = {
  EAIONRTLSU: 1,
  DGBCMP: 2,
  FHVWY: 3,
  KJX: 4,
  QZ: 5,
};

export const LetterColours: Record<LetterGroupKey, string> = {
  EAIONRTLSU: '#03fca1',
  DGBCMP: '#45b8ff',
  FHVWY: '#ff8624',
  KJX: '#ff3333',
  QZ: '#000000',
};

export const levelList: string[] = [
  'dog',
  'cat',
  'ball',
  'away',
  'pizza',
  'banana',
  'extreme',
  'toilet',
  'igloo',
  'harder',
  'malapropism',
  'funambulist',
  'verisimilitude',
  'valetudinarian',
  'antiestablishmentarianism',
];

export const defaultHoleAttributes: [number, number, number, number][] = [
  // x, y, score, size
  [180, 180, 1, 36],
  [320, 180, 1, 36],
  [110, 100, 2, 30],
  [390, 100, 2, 30],
  [250, 55, 5, 24],
];
