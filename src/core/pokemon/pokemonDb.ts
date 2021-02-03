import FuzzyMatching = require('fuzzy-matching');
import { Pokemon } from "./pokemonModels";
import database from '../../../data/pokemon-db.json'

export class PokemonDb {

  private pokemonMap: { [name: string]: Pokemon } = {};
  private fuzzyMatching: FuzzyMatching;

  constructor() {
    this.loadFileData();
    this.fuzzyMatching = new FuzzyMatching(database.map(p => p.name));
  }

  public getPokemon(name: string): Pokemon {
    const pokemon = this.pokemonMap[name.toLowerCase()];
    if (pokemon)
      return pokemon;

    const match = this.fuzzyMatching.get(name);
    return (match.distance >= 0.5)
      ? this.pokemonMap[match.value.toLowerCase()]
      : undefined;
  }

  private loadFileData(): void {
    database.forEach(i => {
      this.pokemonMap[i.name.toLowerCase()] = i as Pokemon;
    });
  }
}