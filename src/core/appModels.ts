import { Pokemon } from "./pokemon/pokemonModels";
import { ChecksAndCountersUsageData, MoveSetUsage, PokemonUsage, SmogonFormat, UsageData } from "./smogon/usageModels";

export type ViewMode = "battlefield" | "player" | "opponent";

export type TeamMode = Exclude<ViewMode, "battlefield">;

export type ResolvedPokemon = {
  teamMemberName: string;
  pokemon: Pokemon | undefined;
};

export type FoundPokemon = {
  teamMemberName: string;
  pokemon: Pokemon;
};

export type UsageEntryWithTypeIcon = UsageData & {
  typeIconSrc?: string;
};

export type ChecksAndCountersEntryWithSprite = ChecksAndCountersUsageData & {
  pokemonSpriteName?: string;
};

export type LeadEntryWithSprite = PokemonUsage & {
  pokemonSpriteName?: string;
};

export type DecoratedMoveSetUsage = MoveSetUsage & {
  moves: UsageEntryWithTypeIcon[];
  teraTypes?: UsageEntryWithTypeIcon[];
  checksAndCounters: ChecksAndCountersEntryWithSprite[];
};

export type TeamViewItem = {
  name: string;
  pokemon: Pokemon;
  gifUrl: string;
  format: SmogonFormat;
  usageData: DecoratedMoveSetUsage | undefined;
  sets: Array<{ name: string; set: string }>;
};

export type TeamBuildResult = {
  missingPokemon: string[];
  foundPokemon: Pokemon[];
  teamViewItems: TeamViewItem[];
};

export type BattlefieldViewData = {
  playerLeads: LeadEntryWithSprite[];
  opponentLeads: LeadEntryWithSprite[];
};

export type BattleViewState = {
  activeMode: ViewMode;
  formatLabel: string;
  teams: Record<TeamMode, TeamViewItem[]>;
  battlefield: BattlefieldViewData;
};

export type SubHeaderModeOption = {
  label: string;
  mode: ViewMode;
  isActive: boolean;
};