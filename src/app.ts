/// <reference types="chrome" />

import { PokemonDb } from "./core/pokemon/pokemonDb";
import { SmogonStats } from "./core/smogon/smogonStats";
import pokemonListTemplate from './templates/pokemonItem.hbs';
import userMessageTemplate from './templates/message.hbs';
import { BattleInfo, ResponseMessage } from "./core/extensionModels";
import { SmogonSets } from "./core/smogon/smogonSets";
import { FormatHelper } from "./core/formatHelper";
import { ImageService } from "./core/pokemon/imageService";

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
  const smogonStats = new SmogonStats();
  await SmogonSets.initialize();

  const team = battleInfo.opponentTeam;
  const format = FormatHelper.getFormatFromKey(battleInfo.format);
  const teamMoveset = await Promise.all(team.map(async pkmName => await smogonStats.getMoveSet(pkmName, format)));

  const teamUsageData = team.map(pkmName => pkmName.replace("-*", ""))
                            .map(pkmName => pokemonDb.getPokemon(pkmName))
                            .map(pkm => ({
                              name: pkm.name, 
                              pokemon: pkm, 
                              gifUrl: ImageService.getGifUrl(pkm),
                              format: format,
                              usageData: teamMoveset.find(i => i?.name == pkm?.name),
                              sets: SmogonSets.get(pkm, format)
                                              .map(set => ({name: set.name, set: FormatHelper.getSmogonSet(pkm, set)}))
                            }));
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
  const materialize = (window as Window & { M?: any }).M;
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