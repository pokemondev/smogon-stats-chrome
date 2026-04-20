/// <reference types="chrome" />

import { Pokemon, PokemonType } from "./core/pokemon/pokemonModels";
import { PokemonDb } from "./core/pokemon/pokemonDb";
import { SmogonStats } from "./core/smogon/smogonStats";
import battlefieldTemplate from './templates/battlefield.hbs';
import subHeaderTemplate from './templates/subHeader.hbs';
import pokemonListTemplate from './templates/pokemonItem.hbs';
import userMessageTemplate from './templates/message.hbs';
import {
  BattlefieldViewData,
  BattleViewState,
  ChecksAndCountersEntryWithSprite,
  DecoratedMoveSetUsage,
  FoundPokemon,
  LeadEntryWithSprite,
  ResolvedPokemon,
  SubHeaderModeOption,
  TeamBuildResult,
  UsageEntryWithTypeIcon,
  ViewMode,
} from "./core/appModels";
import { BattleInfo, ResponseMessage } from "./core/extensionModels";
import { SmogonSets } from "./core/smogon/smogonSets";
import { FormatHelper } from "./core/formatHelper";
import { ImageService } from "./core/pokemon/imageService";
import { Movedex } from "./core/pokemon/movedex";
import { ChecksAndCountersUsageData, MoveSetUsage, PokemonUsage, SmogonFormat, UsageData } from "./core/smogon/usageModels";

const supportedTypeIconNames = new Set<string>(Object.values(PokemonType).map(type => type.toLowerCase()));
const unresolvedSpriteNames = new Set<string>(["other", "nothing"]);

let communicationDone = false;
let showdownResponseTimeout: number | undefined;
let battleViewState: BattleViewState | undefined;

document.addEventListener("DOMContentLoaded", function() {
  loadBattleInfo();

  // debugs
  //displayError("Couldn't find an active battle. Please open a battle tab in Pokemon Showdown first and try again.</br>(Doesn't support random battles yet)")
  //displayBattleInfo(new BattleInfo("gen8vgc2021", ["Groudon", "Charizard", "Venusaur", "Regieleki", "Porygon2", "Incineroar"], ["Ninetales-Alola", "Arctozolt", "Tyranitar", "Zapdos-Galar", "Indeedee-F", "Beartic"]));
  //displayBattleInfo(new BattleInfo("gen8ou", ["Slowbro", "Cinderace", "Dragapult", "Dragonite", "Zapdos", "Nidoking"], ["Moltres", "Swampert", "Clefable", "Tapu Lele", "Rillaboom", "Magearna"]));
  //displayBattleInfo(new BattleInfo("gen9ou", ["Tyranitar", "Scizor", "Dragapult", "Dragonite", "Charizard", "Pikachu"], ["Moltres", "Urshifu-Rapid-Strike", "Amoonguss", "Gholdengo", "Rillaboom", "Flutter Mane"]));
});

function loadBattleInfo() {
  showdownResponseTimeout = window.setTimeout(checkShowdownTabAnswer, 3000);

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const activeTab = tabs && tabs.length > 0
      ? tabs[0]
      : undefined;

    if (!activeTab || activeTab.id === undefined) {
      displayError("Couldn't find the active browser tab. Please reopen the popup and try again.");
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, { operation: "getOpponentsTeam" },
      function(response: ResponseMessage<BattleInfo>) {
        if (chrome.runtime.lastError) {
          displayError(
            "Couldn't contact the Pokemon Showdown page. Open an active battle tab on Pokemon Showdown and try again.",
            [
              chrome.runtime.lastError.message || "Unknown chrome.runtime.lastError.",
              "If you just reloaded the extension, refresh the Pokemon Showdown battle tab so the new content script is injected.",
            ],
          );
          return;
        }

        if (!response) {
          displayError(
            "Pokemon Showdown didn't return battle data. Please refresh the page and try again.",
            ["The popup message reached the tab, but no response payload came back from the content script."],
          );
          return;
        }

        if (response.success && response.data) {
          const isLikelyOldContentScript = typeof response.data.playerTeam === "undefined";
          const battleInfo = new BattleInfo(response.data.format, response.data.opponentTeam, response.data.playerTeam);
          if (!battleInfo.hasBothTeams()) {
            displayError(
              "It wasn't possible to load both teams. Please refresh the Pokemon Showdown page and try again.",
              [
                `Received format=${response.data.format || "(missing)"}.`,
                `Opponent team size=${battleInfo.opponentTeam.length}.`,
                `Player team size=${battleInfo.playerTeam.length}.`,
                isLikelyOldContentScript
                  ? "The active Showdown tab likely still has an older content script. Refresh the battle tab after reloading the extension."
                  : "The content script returned incomplete battle data.",
              ].concat(response.debugInfo || []),
            );
            return;
          }

          displayBattleInfo(battleInfo);
          return;
        }

        displayError(
          response.errorMessage || "Pokemon Showdown returned an invalid response. Please refresh the page and try again.",
          response.debugInfo,
        );
      });
  });
}

async function displayBattleInfo(battleInfo: BattleInfo) {
  const pokemonDb = new PokemonDb();
  const movedex = new Movedex();
  const smogonStats = new SmogonStats();
  await SmogonSets.initialize();

  const format = FormatHelper.getFormatFromKey(battleInfo.format);
  const leads = await smogonStats.getLeads(format);
  const [playerTeam, opponentTeam] = await Promise.all([
    buildTeamViewItems(battleInfo.playerTeam, format, pokemonDb, movedex, smogonStats),
    buildTeamViewItems(battleInfo.opponentTeam, format, pokemonDb, movedex, smogonStats),
  ]);
  const missingPokemon = Array.from(new Set(playerTeam.missingPokemon.concat(opponentTeam.missingPokemon)));

  if (missingPokemon.length > 0) {
    displayError(`It wasn't possible to load data for ${missingPokemon.join(", ")}. Please refresh the Pokemon Showdown page and try again.`);
    return;
  }

  battleViewState = {
    activeMode: "opponent",
    formatLabel: FormatHelper.toString(format),
    teams: {
      player: playerTeam.teamViewItems,
      opponent: opponentTeam.teamViewItems,
    },
    battlefield: {
      playerLeads: getTeamLeads(playerTeam.foundPokemon, leads, pokemonDb),
      opponentLeads: getTeamLeads(opponentTeam.foundPokemon, leads, pokemonDb),
    },
  };

  renderActiveMode();
  completeCommunication();
}

async function buildTeamViewItems(
  team: string[],
  format: SmogonFormat,
  pokemonDb: PokemonDb,
  movedex: Movedex,
  smogonStats: SmogonStats,
): Promise<TeamBuildResult> {
  const teamMovesets = await Promise.all(team.map(async pkmName => await smogonStats.getMoveSet(pkmName, format)));
  const resolvedPokemon: ResolvedPokemon[] = team
    .map(teamMemberName => ({
      teamMemberName,
      pokemon: pokemonDb.getPokemon(teamMemberName.replace("-*", "")),
    }));
  const missingPokemon = resolvedPokemon
    .filter((entry): entry is ResolvedPokemon & { pokemon: undefined } => !entry.pokemon)
    .map(entry => entry.teamMemberName);
  const foundPokemon = resolvedPokemon
    .filter((entry): entry is FoundPokemon => entry.pokemon !== undefined)
    .map(entry => entry.pokemon);
  const teamViewItems = foundPokemon.map(pkm => {
    const usageData = decorateMoveSetUsage(
      teamMovesets.find(moveset => moveset?.name === pkm.name),
      pokemonDb,
      movedex,
    );

    return {
      name: pkm.name,
      pokemon: pkm,
      gifUrl: ImageService.getGifUrl(pkm),
      format: format,
      usageData: usageData,
      sets: SmogonSets.get(pkm, format)
        .map(set => ({ name: set.name || pkm.name, set: FormatHelper.getSmogonSet(pkm, set) })),
    };
  });

  return {
    missingPokemon,
    foundPokemon,
    teamViewItems,
  };
}

function displayError(errorMessage: string, debugInfo?: string[]) {
  if (debugInfo && debugInfo.length > 0) {
    console.error("[Smogon Stats]", errorMessage, debugInfo);
  }
  else {
    console.error("[Smogon Stats]", errorMessage);
  }

  renderMainList(userMessageTemplate({ errorMessage, debugInfo }));
  completeCommunication();
}

function checkShowdownTabAnswer() {
  if (!communicationDone) {
    displayError("Hey, are you sure you're at PokemonShowdown.com? Please go there, open a battle tab and try again.");
  }
}

function renderMainList(content: string) {
  const mainListElement = document.querySelector(".main-list") as HTMLElement;
  if (mainListElement) {
    mainListElement.innerHTML = content;
  }
}

function renderActiveMode() {
  if (!battleViewState) {
    return;
  }

  const modeContent = battleViewState.activeMode === "battlefield"
    ? battlefieldTemplate(battleViewState.battlefield)
    : pokemonListTemplate(battleViewState.teams[battleViewState.activeMode]);

  renderMainList(subHeaderTemplate({
    formatLabel: battleViewState.formatLabel,
    modeOptions: getSubHeaderModeOptions(battleViewState.activeMode),
    content: modeContent,
  }));
  initializeModeSwitcher();
  initializeMaterializeComponents();
}

function getSubHeaderModeOptions(activeMode: ViewMode): SubHeaderModeOption[] {
  return [
    { label: "Battlefield", mode: "battlefield", isActive: activeMode === "battlefield" },
    { label: "Player", mode: "player", isActive: activeMode === "player" },
    { label: "Opponent", mode: "opponent", isActive: activeMode === "opponent" },
  ];
}

function initializeModeSwitcher() {
  const modeButtons = document.querySelectorAll(".mode-switcher-option");
  modeButtons.forEach(button => {
    button.addEventListener("click", function() {
      const selectedMode = (button as HTMLElement).getAttribute("data-mode") as ViewMode | null;
      if (!selectedMode || !battleViewState || battleViewState.activeMode === selectedMode) {
        return;
      }

      battleViewState.activeMode = selectedMode;
      renderActiveMode();
    });
  });
}

function initializeMaterializeComponents() {
  type MaterializeInitializer = {
    init(elements: NodeListOf<Element>): void;
  };

  type MaterializeGlobal = {
    Collapsible: MaterializeInitializer;
    Tabs: MaterializeInitializer;
  };

  const materialize = (window as Window & { M?: MaterializeGlobal }).M;
  if (!materialize) {
    return;
  }

  const collapsibleElements = document.querySelectorAll(".collapsible");
  const tabElements = document.querySelectorAll(".tabs");
  materialize.Collapsible.init(collapsibleElements);
  materialize.Tabs.init(tabElements);
}

function completeCommunication() {
  communicationDone = true;
  if (showdownResponseTimeout !== undefined) {
    window.clearTimeout(showdownResponseTimeout);
    showdownResponseTimeout = undefined;
  }
}

function decorateMoveSetUsage(
  moveset: MoveSetUsage | undefined,
  pokemonDb: PokemonDb,
  movedex: Movedex,
): DecoratedMoveSetUsage | undefined {
  if (!moveset) {
    return undefined;
  }

  return {
    ...moveset,
    moves: moveset.moves.map(move => decorateMoveUsage(move, movedex)),
    teraTypes: moveset.teraTypes?.map(teraType => decorateTeraTypeUsage(teraType)),
    checksAndCounters: moveset.checksAndCounters.map(counter => decorateCounterUsage(counter, pokemonDb)),
  };
}

function decorateMoveUsage(move: UsageData, movedex: Movedex): UsageEntryWithTypeIcon {
  const moveType = shouldResolveNamedAsset(move.name)
    ? movedex.getMove(move.name)?.type
    : undefined;

  return {
    ...move,
    typeIconSrc: getTypeIconSrc(moveType),
  };
}

function decorateTeraTypeUsage(teraType: UsageData): UsageEntryWithTypeIcon {
  return {
    ...teraType,
    typeIconSrc: getTypeIconSrc(teraType.name),
  };
}

function decorateCounterUsage(
  counter: ChecksAndCountersUsageData,
  pokemonDb: PokemonDb,
): ChecksAndCountersEntryWithSprite {
  return {
    ...counter,
    pokemonSpriteName: getCounterSpriteName(counter.name, pokemonDb),
  };
}

function getTeamLeads(
  team: Pokemon[],
  leads: Map<string, PokemonUsage>,
  pokemonDb: PokemonDb,
): LeadEntryWithSprite[] {
  return team
    .map(pokemon => leads.get(pokemon.name))
    .filter((lead): lead is PokemonUsage => !!lead && lead.rank > 0)
    .sort((left, right) => left.rank - right.rank)
    .slice(0, 8)
    .map(lead => decorateLeadUsage(lead, pokemonDb));
}

function decorateLeadUsage(
  lead: PokemonUsage,
  pokemonDb: PokemonDb,
): LeadEntryWithSprite {
  return {
    ...lead,
    pokemonSpriteName: getCounterSpriteName(lead.name, pokemonDb),
  };
}

function getCounterSpriteName(name: string, pokemonDb: PokemonDb): string | undefined {
  if (!shouldResolveNamedAsset(name)) {
    return undefined;
  }

  const pokemon = pokemonDb.getPokemon(name);
  return pokemon
    ? pokemon.name
    : undefined;
}

function getTypeIconSrc(typeName?: string | null): string | undefined {
  const normalizedTypeName = (typeName || "").trim();
  if (!normalizedTypeName) {
    return undefined;
  }

  const lowerTypeName = normalizedTypeName.toLowerCase();
  return supportedTypeIconNames.has(lowerTypeName)
    ? `img/types/${lowerTypeName}.png`
    : undefined;
}

function shouldResolveNamedAsset(name: string): boolean {
  const normalizedName = (name || "").trim().toLowerCase();
  return normalizedName.length > 0 && !unresolvedSpriteNames.has(normalizedName);
}
