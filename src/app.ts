/// <reference types="chrome" />

import { Pokemon, PokemonType } from "./core/pokemon/pokemonModels";
import { PokemonDb } from "./core/pokemon/pokemonDb";
import { SmogonStats } from "./core/smogon/smogonStats";
import pokemonListTemplate from './templates/pokemonItem.hbs';
import userMessageTemplate from './templates/message.hbs';
import { BattleInfo, ResponseMessage } from "./core/extensionModels";
import { SmogonSets } from "./core/smogon/smogonSets";
import { FormatHelper } from "./core/formatHelper";
import { ImageService } from "./core/pokemon/imageService";
import { Movedex } from "./core/pokemon/movedex";
import { ChecksAndCountersUsageData, MoveSetUsage, PokemonUsage, UsageData } from "./core/smogon/usageModels";

type ResolvedPokemon = {
  teamMemberName: string;
  pokemon: Pokemon | undefined;
};

type FoundPokemon = {
  teamMemberName: string;
  pokemon: Pokemon;
};

type UsageEntryWithTypeIcon = UsageData & {
  typeIconSrc?: string;
};

type ChecksAndCountersEntryWithSprite = ChecksAndCountersUsageData & {
  pokemonSpriteName?: string;
};

type LeadEntryWithSprite = PokemonUsage & {
  pokemonSpriteName?: string;
};

type DecoratedMoveSetUsage = MoveSetUsage & {
  moves: UsageEntryWithTypeIcon[];
  teraTypes?: UsageEntryWithTypeIcon[];
  checksAndCounters: ChecksAndCountersEntryWithSprite[];
};

type BattlingTabData = {
  leads: LeadEntryWithSprite[];
};

const supportedTypeIconNames = new Set<string>(Object.values(PokemonType).map(type => type.toLowerCase()));
const unresolvedSpriteNames = new Set<string>(["other", "nothing"]);

let communicationDone = false;
let showdownResponseTimeout: number | undefined;

// initializes the app
document.addEventListener("DOMContentLoaded", function() {
  getOpponentsTeam();
  
  // debugs
  //displayError("Couldn't find an active battle. Please open a battle tab in Pokemon Showdown first and try again.</br>(Doesn't support random battles yet)")
  //displayTeamStats(new BattleInfo("gen8vgc2021", ["Groudon", "Charizard", "Venusaur", "Regieleki", "Porygon2", "Incineroar"]));
  //displayTeamStats(new BattleInfo("gen8vgc2021", ["Ninetales-Alola", "Arctozolt", "Tyranitar", "Zapdos-Galar", "Indeedee-F", "Beartic"]));
  //displayTeamStats(new BattleInfo("gen8ou", ["Slowbro", "Cinderace", "Dragapult", "Dragonite", "Zapdos", "Nidoking"]));
  //displayTeamStats(["Moltres", "Swampert", "Clefable", "Tapu Lele", "Rillaboom", "Magearna"]);
  //displayTeamStats(["Blacephalon", "Urshifu-*", "Jirachi", "Sableye", "Togekiss", "Mamoswine"]);
  //displayTeamStats(new BattleInfo("gen8uu", ["Sylveon", "Scizor", "Zeraora", "Salamence", "Victini", "Latias"]));
  // gen9----------------  
  //displayTeamStats(new BattleInfo("gen9ou", ["Tyranitar", "Scizor", "Dragapult", "Dragonite", "Charizard", "Pikachu"]));
  //displayTeamStats(new BattleInfo("vgc2026regf", ["Tyranitar", "Scizor", "Dragapult", "Dragonite", "Charizard", "Pikachu"]));
});

function getOpponentsTeam() {
  showdownResponseTimeout = window.setTimeout(checkShowdownTabAnswer, 3000); // shows error message after 3 seconds

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const activeTab = tabs && tabs.length > 0
      ? tabs[0]
      : undefined;

    if (!activeTab || activeTab.id === undefined) {
      displayError("Couldn't find the active browser tab. Please reopen the popup and try again.");
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, { operation: "getOpponentsTeam" },
      function (response: ResponseMessage<BattleInfo>) {
        if (chrome.runtime.lastError) {
          displayError("Couldn't contact the Pokemon Showdown page. Open an active battle tab on Pokemon Showdown and try again.");
          return;
        }

        if (!response) {
          displayError("Pokemon Showdown didn't return battle data. Please refresh the page and try again.");
          return;
        }

        if (response.success && response.data) {
          const battleInfo = new BattleInfo(response.data.format, response.data.opponentTeam);
          const anyMonInTheTeam = battleInfo && battleInfo.isValidTeam(); 
          if (!anyMonInTheTeam) {
            displayError("It wasn't possible to load the team. Please refresh the Pokemon Showdown page and try again.");
            return;
          }

          displayTeamStats(battleInfo);
        }
        else {
          displayError(response.errorMessage || "Pokemon Showdown returned an invalid response. Please refresh the page and try again.");
        }
    });
  });
}

async function displayTeamStats(battleInfo: BattleInfo) {
  const pokemonDb = new PokemonDb();
  const movedex = new Movedex();
  const smogonStats = new SmogonStats();
  await SmogonSets.initialize();

  const team = battleInfo.opponentTeam;
  const format = FormatHelper.getFormatFromKey(battleInfo.format);
  const teamMoveset = await Promise.all(team.map(async pkmName => await smogonStats.getMoveSet(pkmName, format)));
  const leads = await smogonStats.getLeads(format);
  const resolvedPokemon: ResolvedPokemon[] = team
    .map(teamMemberName => ({
      teamMemberName,
      pokemon: pokemonDb.getPokemon(teamMemberName.replace("-*", "")),
    }));
  const missingPokemon = resolvedPokemon
    .filter((entry): entry is ResolvedPokemon & { pokemon: undefined } => !entry.pokemon)
    .map(entry => entry.teamMemberName);

  if (missingPokemon.length > 0) {
    displayError(`It wasn't possible to load data for ${missingPokemon.join(", ")}. Please refresh the Pokemon Showdown page and try again.`);
    return;
  }

  const foundPokemon = resolvedPokemon
    .filter((entry): entry is FoundPokemon => entry.pokemon !== undefined)
    .map(entry => entry.pokemon);
  const battlingData = {
    leads: getOpponentLeads(foundPokemon, leads, pokemonDb),
  } as BattlingTabData;

  const teamUsageData = foundPokemon
                            .map(pkm => {
                              const usageData = decorateMoveSetUsage(
                                teamMoveset.find(moveset => moveset?.name === pkm.name),
                                pokemonDb,
                                movedex,
                              );

                              return {
                                name: pkm.name,
                                pokemon: pkm,
                                gifUrl: ImageService.getGifUrl(pkm),
                                format: format,
                                formatLabel: FormatHelper.toString(format),
                                battlingData: battlingData,
                                usageData: usageData,
                                sets: SmogonSets.get(pkm, format)
                                                .map(set => ({name: set.name, set: FormatHelper.getSmogonSet(pkm, set)}))
                              };
                            });
  console.log(teamUsageData);
  
  renderMainList(pokemonListTemplate(teamUsageData));
  initializeMaterializeComponents();
  completeCommunication();
}

function displayError(errorMessage: string) {
  renderMainList(userMessageTemplate({ errorMessage }));
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

function getOpponentLeads(
  opponentTeam: Pokemon[],
  leads: Map<string, PokemonUsage>,
  pokemonDb: PokemonDb,
): LeadEntryWithSprite[] {
  return opponentTeam
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