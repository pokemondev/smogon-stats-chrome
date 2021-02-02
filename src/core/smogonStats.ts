import { PokemonUsage, MoveSetUsage, SmogonFormat } from "./usageModels";
import { FormatHelper } from "./formatHelper";
import movesetGen8OU from '../../data/smogon-stats/gen8/ou/moveset-gen8ou.json'
import usageGen8OU from '../../data/smogon-stats/gen8/ou/usage-gen8ou.json'

export class SmogonStats {

  //private database: { [id: string]: any; } = {};
  private usages: Map<string, PokemonUsage>;

  public getMoveSets(format: SmogonFormat, filter: (pkm: MoveSetUsage) => boolean = undefined): MoveSetUsage[] {
    const sets = movesetGen8OU as unknown as MoveSetUsage[];
    return filter
      ? sets.filter(filter)
      : sets;
  }

  public getMoveSet(pokemon: string, format: SmogonFormat = undefined): MoveSetUsage {
    const sets = this.getMoveSets(format);
    var moveset = sets.find(e => e.name.toLowerCase() == pokemon.toLowerCase());
    if (moveset)
      moveset.usage = this.getUsage(moveset.name).rank;
    return moveset;
  }

  public getUsages(format: SmogonFormat = undefined): Map<string, PokemonUsage> {
    if (!this.usages) {
      this.usages = new Map;
      //[1,"Zygarde",24.764,369434,15.561,288085,15.522]
      for (let i = 0; i < usageGen8OU.data.rows.length; i++) {
        const mon = usageGen8OU.data.rows[i];
        this.usages.set(mon[1].toString(), { name: mon[1], rank: mon[0], usageRaw: mon[2] } as PokemonUsage);
      }
    } 
    return this.usages
  }

  public getUsage(pokemon: string, format: SmogonFormat = undefined): PokemonUsage {
    const usages = this.getUsages();
    return usages.get(pokemon);
  }
} 