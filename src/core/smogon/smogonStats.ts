import { PokemonUsage, MoveSetUsage, SmogonFormat } from "./usageModels";
import { FormatHelper } from "../formatHelper";
import movesetGen8OU from '../../../data/smogon-stats/gen8/ou/moveset-gen8ou.json'
import usageGen8OU from '../../../data/smogon-stats/gen8/ou/usage-gen8ou.json'
import { FileHelper } from "../common/fileHelper";

export class SmogonStats {

  //private database: { [id: string]: any; } = {};
  private usages: Map<string, PokemonUsage>;
  private database: Map<string, any> = new Map;

  public async getMoveSets(format: SmogonFormat, filter: (pkm: MoveSetUsage) => boolean = undefined): Promise<MoveSetUsage[]> {
    const sets = await this.getMovesetData(format) // as unknown as MoveSetUsage[];
    return filter
      ? sets.filter(filter)
      : sets;
  }

  public async getMoveSet(pokemon: string, format: SmogonFormat = undefined): Promise<MoveSetUsage> {
    const sets = await this.getMoveSets(format);
    var moveset = sets.find(e => e.name.toLowerCase() == pokemon.toLowerCase());
    if (moveset)
      moveset.usage = this.getUsage(moveset.name).rank;
    
    console.log(moveset);
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

  // privates
  private async getMovesetData(format: SmogonFormat = undefined): Promise<MoveSetUsage[]> {
    return await this.getData<MoveSetUsage[]>("moveset", format);
  }

  private async getData<T>(dataType: string, format: SmogonFormat = undefined): Promise<T> {
    format = format || FormatHelper.getDefault();
    
    const dataKey = `${dataType}-${FormatHelper.getKeyFrom(format)}`;
    //const data:T = this.database.get(dataKey)
    const data:T = await FileHelper.loadFileData<T>(`smogon-stats/${format.generation}/${format.tier}/${dataKey}.json`);
    
    this.database.set(dataKey, data);
    return data;
  }
} 