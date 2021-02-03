import { PokemonDb } from "./core/pokemon/pokemonDb";
import { SmogonStats } from "./core/smogon/smogonStats";
import pokemonListTemplate from './templates/pokemonItem.hbs';
import userMessageTemplate from './templates/message.hbs';
import { ResponseMessage } from "./core/extensionModels";
import { SmogonSets } from "./core/smogon/smogonSets";
import { FormatHelper } from "./core/formatHelper";

let communicationDone = false;

// initializes the app
jQuery(function() {
  getOpponentsTeam();
  
  // debugs
  //displayError("Couldn't find an active battle. Please open a battle tab in Pokemon Showdown first and try again.</br>(Doesn't support random battles yet)")
  //displayTeamStats(["Slowbro", "Cinderace", "Dragapult", "Dragonite", "Zapdos", "Nidoking"]);
  //displayTeamStats(["Moltres", "Swampert", "Clefable", "Tapu Lele", "Rillaboom", "Magearna"]);
  //displayTeamStats(["Blacephalon", "Urshifu-*", "Jirachi", "Sableye", "Togekiss", "Mamoswine"]);
});

function getOpponentsTeam() {
  setTimeout(checkShowdownTabAnswer, 3000); // shows error message after 3 seconds

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { operation: "getOpponentsTeam", test: "dfsdf" },
      function (response: ResponseMessage<string[]>) {
        if (response.success) {
          const team = response.data;
          const anyMonInTheTeam = team && team.length > 0; 
          if (!anyMonInTheTeam) {
            displayError("It wasn't possible to load the team. Please refresh the Pokemon Showdown page and try again.")
            return;
          }

          displayTeamStats(team);
        } 
        else {
          displayError(response.errorMessage);
        }
    });
  });
}

async function displayTeamStats(team: string[]) {
  const pokemonDb = new PokemonDb();
  const smogonStats = new SmogonStats();
  await SmogonSets.initialize();

  const teamUsageData = team.map(pkmName => pkmName.replace("-*", ""))
                            .map(pkmName => pokemonDb.getPokemon(pkmName))
                            .map(pkm => ({
                              name: pkm.name, 
                              pokemon: pkm, 
                              usageData: smogonStats.getMoveSet(pkm.name),
                              sets: SmogonSets.get(pkm, FormatHelper.getDefault())
                                              .map(set => ({name: set.name, set: FormatHelper.getSmogonSet(pkm, set)}))
                            }));
  console.log(teamUsageData);
  
  $(".main-list").html(pokemonListTemplate(teamUsageData));
  $('.collapsible').collapsible();
  $('.tabs').tabs();
  communicationDone = true;
}

function displayError(errorMessage: string) {
  $(".main-list").html(userMessageTemplate({ errorMessage }));
  communicationDone = true;
}

function checkShowdownTabAnswer() {
  if (!communicationDone) {
    displayError("Hey, are you sure you're at PokemonShowdown.com? Please go there, open a battle tab and try again.")
  }
}