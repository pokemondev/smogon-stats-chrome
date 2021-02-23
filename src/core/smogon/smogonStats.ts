import { PokemonUsage, MoveSetUsage, SmogonFormat } from "./usageModels";
import { FormatHelper } from "../formatHelper";
import { FileHelper } from "../common/fileHelper";

export class SmogonStats {

  private usages: Map<string, PokemonUsage>;
  private database: Map<string, any> = new Map;

  public async getMoveSets(format: SmogonFormat, filter: (pkm: MoveSetUsage) => boolean = undefined): Promise<MoveSetUsage[]> {
    const sets = await this.getMovesetData(format);
    return filter
      ? sets.filter(filter)
      : sets;
  }

  public async getMoveSet(pokemon: string, format: SmogonFormat = undefined): Promise<MoveSetUsage> {
    const sets = await this.getMoveSets(format);
    var moveset = sets.find(e => e.name.toLowerCase() == pokemon.toLowerCase());
    if (moveset)
      moveset.usage = (await this.getUsage(pokemon, format))?.rank || 0;
    return moveset;
  }

  public async getUsages(format: SmogonFormat = undefined): Promise<Map<string, PokemonUsage>> {
    if (!this.usages) {
      //[1,"Zygarde",24.764,369434,15.561,288085,15.522]
      const usageData = await this.getUsageData(format);
      
      this.usages = new Map;
      for (const mon of usageData.data.rows) {
        this.usages.set(mon[1].toString(), { name: mon[1], rank: mon[0], usageRaw: mon[2] } as PokemonUsage);
      }
    }
    return this.usages;
  }

  public async getUsage(pokemon: string, format: SmogonFormat = undefined): Promise<PokemonUsage> {
    const usages = await this.getUsages(format);
    return usages.get(pokemon);
  }

  // privates
  private async getMovesetData(format: SmogonFormat = undefined): Promise<MoveSetUsage[]> {
    return await this.getData<MoveSetUsage[]>("moveset", format);
  }

  private async getUsageData(format: SmogonFormat = undefined): Promise<any> {
    return await this.getData<any>("usage", format);
  }

  private async getData<T>(dataType: string, format: SmogonFormat = undefined): Promise<T> {
    format = format || FormatHelper.getDefault();
    
    const dataKey = `${dataType}-${FormatHelper.getKeyFrom(format)}`;
    const data:T = this.database.has(dataKey)
      ? this.database.get(dataKey)
      : await FileHelper.loadFileData<T>(`smogon-stats/${format.generation}/${format.tier}/${dataKey}.json`);
    
    this.database.set(dataKey, data);
    return data;
  }
} 