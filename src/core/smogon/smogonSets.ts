import { FileHelper } from "../common/fileHelper";
import { PokemonSet } from "./setsModels";
import { Pokemon } from "../pokemon/pokemonModels";
import { getMap, areEquals } from "../common/objectHelper";
import { FormatHelper } from "../formatHelper";
import { SmogonFormat } from "./usageModels";

type PokemonSetMap = Map<string, PokemonSet[]>;
type PokemonSetDb = Map<string, PokemonSetMap>;

export class SmogonSets {

  private static setsDb: PokemonSetDb = new Map;

  public static get(pokemon: Pokemon, format: SmogonFormat): PokemonSet[] {
    if (!pokemon) {
      return [];
    }

    const gen = format.generation;
    const generationSets = this.setsDb.get(gen);
    if (!generationSets)
      return [];

    const sets = generationSets.get(pokemon.name);
    return sets
      ? sets.filter(set => areEquals(set.format, format))
      : [];
  }

  public static async initialize(): Promise<void> {
    if (this.setsDb.size > 0) {
      return;
    }

    const gens = FormatHelper.Generations;
    for (const gen of gens) {
      const genSetMap: PokemonSetMap = new Map;
      const setsData = await FileHelper.loadFileData<{ [id: string]: { [id: string]: PokemonSet } }>(`smogon-sets/${gen}-sets.json`);
      console.log(`Loaded ${gen} sets containing ${Object.keys(setsData).length} mons`);

      Object.keys(setsData).forEach(pokemon => {
        var pokemonSets = getMap<PokemonSet>(setsData[pokemon]);
        const supportedSets = Array.from(pokemonSets.keys())
          .map(setName => {
            const set = pokemonSets.get(setName);
            const format = FormatHelper.getFormatFromSetName(setName, gen);
            if (!set || !format) {
              return undefined;
            }

            set.name = setName;
            set.format = format;
            return set;
          })
          .filter(set => !!set);

        genSetMap.set(pokemon, supportedSets);
      });

      // add gen to sets db
      this.setsDb.set(gen, genSetMap);
    };
  }
}