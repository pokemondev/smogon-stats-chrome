import { Pokemon } from "./pokemon/pokemonModels";
import { Evs, PokemonSet } from "./smogon/setsModels";
import { SmogonFormat } from "./smogon/usageModels";

export class FormatHelper {
  private static readonly SupportedFormats: SmogonFormat[] = [
    { generation: "gen9", tier: "vgc2026regf" },
    { generation: "gen9", tier: "vgc2026regi" },
    { generation: "gen9", tier: "ubers" },
    { generation: "gen9", tier: "ou" },
    { generation: "gen9", tier: "uu" },
    { generation: "gen9", tier: "ru" },
    { generation: "gen8", tier: "ou" },
    { generation: "gen8", tier: "uu" },
    { generation: "gen8", tier: "vgc2021" },
    { generation: "gen9", tier: "nu" },
  ];
  private static readonly VgcRegulations: { [id: string]: string } = {
    regf: "vgc2026regf",
    regi: "vgc2026regi"
  };
  private static readonly LegacyVgcAliases: { [id: string]: string } = {
    "2021": "vgc2021"
  };
  public static Generations = FormatHelper.getDistinctGenerations();
  public static Tiers = FormatHelper.getDistinctTiers();
  
  public static getFormat(args: string[]): SmogonFormat {
    const normalizedArgs = args
      .filter(arg => !!arg)
      .map(arg => arg.toLowerCase());

    const supportedKey = normalizedArgs.find(arg => this.isValidFormat(arg));
    if (supportedKey) {
      return this.getFormatFromKey(supportedKey);
    }

    const gen = normalizedArgs.find(arg => this.isValidGen(arg));
    const tier = normalizedArgs
      .map(arg => this.normalizeTier(arg))
      .find(arg => this.isValidTier(arg));

    if (gen && tier) {
      const supportedFormat = this.getSupportedFormat(gen, tier);
      if (supportedFormat) {
        return supportedFormat;
      }
    }

    return this.getDefault();
  }

  public static getFormatFromKey(format: string): SmogonFormat {
    const normalizedFormat = (format || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const supportedFormat = this.SupportedFormats.find(candidate =>
      normalizedFormat.includes(this.getKeyFrom(candidate))
    );

    if (supportedFormat) {
      return supportedFormat;
    }

    const generation = this.Generations.find(gen => normalizedFormat.includes(gen));
    const tier = this.normalizeTier(normalizedFormat);
    if (generation && this.isValidTier(tier)) {
      const matchedFormat = this.getSupportedFormat(generation, tier);
      if (matchedFormat) {
        return matchedFormat;
      }
    }

    const vgcTier = this.getVgcTierFromText(normalizedFormat);
    if (vgcTier) {
      const matchedVgcFormat = this.getSupportedFormat("gen9", vgcTier)
        || this.getSupportedFormat("gen8", vgcTier);
      if (matchedVgcFormat) {
        return matchedVgcFormat;
      }
    }

    return this.getDefault();
  }

  public static getFormatFromSetName(setName: string, generation: string): SmogonFormat | undefined {
    const normalizedSetName = (setName || "").trim().toLowerCase();
    const supportedSinglesTiers = this.getSinglesTiersForGeneration(generation);
    const singlesTier = supportedSinglesTiers.find(tier =>
      normalizedSetName === tier || normalizedSetName.startsWith(`${tier} `)
    );

    if (singlesTier) {
      return this.getSupportedFormat(generation, singlesTier);
    }

    const vgcTier = this.getVgcTierFromText(normalizedSetName);
    if (vgcTier) {
      return this.getSupportedFormat(generation, vgcTier);
    }

    return undefined;
  }

  public static isValidGen(gen: string): boolean {
    return this.Generations.some(g => g === gen.toLowerCase());
  }

  public static isValidTier(tier: string): boolean {
    return this.Tiers.some(t => t === this.normalizeTier(tier));
  }

  public static isValidFormat(format: string): boolean {
    const normalizedFormat = (format || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    return this.SupportedFormats.some(candidate => normalizedFormat.includes(this.getKeyFrom(candidate)));
  }

  public static getDefault(): SmogonFormat {
    return { generation: "gen9", tier: "ou" }; 
  }

  public static getKeyFrom(format: SmogonFormat): string {
    return format.generation + format.tier;
  }

  public static toString(format: SmogonFormat): string {
    return `Gen${format.generation[format.generation.length-1]} ${format.tier.toUpperCase()}`;
  }

  public static getSmogonSet(pokemon: Pokemon, set: PokemonSet): string {
    let evCounter = 0;
    let pkmSetText = "";
    const evs = set.evs || {};
    pkmSetText = pokemon.name + (set.item ? " @ " + set.item : "") + "\n";
    pkmSetText += set.nature ? set.nature + " Nature" + "\n" : "";
    pkmSetText += set.ability ? "Ability: " + set.ability + "\n" : "";
    
    const evsArray: string[] = [];
    for (const stat of Object.keys(evs) as Array<keyof Evs>) {
      const statValue = evs[stat];
      if (statValue) {
        evsArray.push(statValue + " " + this.getDisplayStatName(stat));
        evCounter += statValue;
        if (evCounter > 510) break;
      }
    }
    if (evsArray.length > 0) {
      pkmSetText += "EVs: ";
      pkmSetText += evsArray.reduce((a,b) => `${a} / ${b}`);
      pkmSetText += "\n";
    }
    
    for (let i = 0; i < 4; i++) {
      const moveName = set.moves[i];
      if (moveName !== "(No Move)") {
        pkmSetText += "- " + moveName + "\n";
      }
    }
    pkmSetText = pkmSetText.trim();
    return pkmSetText;
  }

  // helpers
  
  private static getDistinctGenerations(): string[] {
    return Array.from(new Set(this.SupportedFormats.map(format => format.generation)));
  }

  private static getDistinctTiers(): string[] {
    const tiers = this.SupportedFormats.map(format => format.tier).concat([ "uber" ]);
    return Array.from(new Set(tiers));
  }

  private static getSupportedFormat(generation: string, tier: string): SmogonFormat | undefined {
    return this.SupportedFormats.find(format =>
      format.generation === generation && format.tier === this.normalizeTier(tier)
    );
  }

  private static getSinglesTiersForGeneration(generation: string): string[] {
    return this.SupportedFormats
      .filter(format => format.generation === generation && !format.tier.startsWith("vgc"))
      .map(format => format.tier);
  }

  private static getVgcTierFromText(text: string): string | undefined {
    const regulationMatch = text.match(/reg([a-z])/i);
    if (regulationMatch) {
      return this.VgcRegulations[`reg${regulationMatch[1].toLowerCase()}`];
    }

    const legacyYearMatch = text.match(/vgc(\d{4})/i);
    if (legacyYearMatch) {
      return this.LegacyVgcAliases[legacyYearMatch[1]];
    }

    const spacedLegacyYearMatch = text.match(/vgc\s+(\d{4})/i);
    if (spacedLegacyYearMatch) {
      return this.LegacyVgcAliases[spacedLegacyYearMatch[1]];
    }

    return undefined;
  }

  private static normalizeTier(tier: string): string {
    if (!tier) {
      return tier;
    }

    if (tier === "uber") {
      return "ubers";
    }

    const vgcTier = this.getVgcTierFromText(tier);
    return vgcTier || tier.toLowerCase();
  }

  private static getDisplayStatName(stat: keyof Evs): string {
    switch (stat) {
      case 'hp': return 'HP';
      case 'at': return 'Atk';
      case 'df': return 'Def';
      case 'sa': return 'SpA';
      case 'sd': return 'SpD';
      case 'sp': return 'Spe';
    }
  }
}