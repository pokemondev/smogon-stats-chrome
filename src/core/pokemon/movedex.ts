import FuzzyMatching from 'fuzzy-matching';
import { MoveInfo } from "./moves";
import database from '../../../data/movedex.json'

export class Movedex {

  private moveMap: Record<string, MoveInfo> = {};
  private fuzzyMatching: FuzzyMatching;

  constructor() {
    this.loadFileData();
    this.fuzzyMatching = new FuzzyMatching(database.map(move => move.name));
  }

  public getMove(name: string): MoveInfo | undefined {
    const move = this.moveMap[name.toLowerCase()];
    if (move) {
      return move;
    }

    const match = this.fuzzyMatching.get(name);
    return (match.distance >= 0.5 && match.value)
      ? this.moveMap[match.value.toLowerCase()]
      : undefined;
  }

  private loadFileData(): void {
    database.forEach(move => {
      this.moveMap[move.name.toLowerCase()] = move as MoveInfo;
    });
  }
}
