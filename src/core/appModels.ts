import { BattleTeamMember } from "./extensionModels";
import { Pokemon } from "./pokemon/pokemonModels";
import { ChecksAndCountersUsageData, MoveSetUsage, PokemonUsage, SmogonFormat, UsageData } from "./smogon/usageModels";

export type ViewMode = "battlefield" | "player" | "opponent";

export type TeamMode = Exclude<ViewMode, "battlefield">;

export type ResolvedPokemon = {
  teamIndex: number;
  teamMember: BattleTeamMember;
  pokemon: Pokemon | undefined;
};

export type FoundPokemon = {
  teamIndex: number;
  teamMember: BattleTeamMember;
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

export type TeamViewItemVariant = {
  name: string;
  pokemon: Pokemon;
  gifUrl: string;
  usageData: DecoratedMoveSetUsage | undefined;
  sets: Array<{ name: string; set: string }>;
};

export type TeamViewItemFormOption = {
  name: string;
  label: string;
  isActive: boolean;
};

export type TeamViewItemFormControl = {
  elementId: string;
  isToggle: boolean;
  isSelect: boolean;
  isMegaActive: boolean;
  indicatorIconItemName?: string;
  toggleTargetName?: string;
  toggleChecked?: boolean;
  toggleLabel?: string;
  options?: TeamViewItemFormOption[];
};

export type TeamViewItem = TeamViewItemVariant & {
  teamIndex: number;
  baseName: string;
  format: SmogonFormat;
  activeFormName: string;
  variants: Record<string, TeamViewItemVariant>;
  formControl?: TeamViewItemFormControl;
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