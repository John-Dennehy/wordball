// Domain types for Wordball Xtreme
import Level from '../model/level';
import Game from '../model/SkillGame';

export type LetterGroupKey = 'EAIONRTLSU' | 'DGBCMP' | 'FHVWY' | 'KJX' | 'QZ';
export type LetterColourKey = LetterGroupKey;

export interface LetterInfo {
  character: string;
  score: number;
  colour: string;
}

export interface ScoreHole {
  xPos: number;
  yPos: number;
  score: number;
  radius: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
}

export interface ValidWordEntry {
  word: string;
  score: number;
  multiplier: number;
}

export interface LeaderboardEntry {
  name: string;
  skillScore: number;
  smartScore: number;
  total: number;
  date?: string;
}

export interface WordScoreResult {
  baseScore: number;
  multiplier: number;
  totalScore: number;
}

export interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface SkillGameState {
  score: number;
  currentBallIdx: number;
  bankedLetters: string[];
  gameOver: boolean;
  isAdvancing: boolean;
}

export interface SkillGameLocationState {
  level?: Level;
  playGame?: Game;
}

export interface SmartGameLocationState {
  bankedLetters?: string[];
  skillScore?: number;
  targetWord?: string;
}

export interface ScoreLocationState {
  skillScore?: number;
  smartScore?: number;
  totalScore?: number;
  validWords?: string[];
}

export type ScoresLocationState = ScoreLocationState;
