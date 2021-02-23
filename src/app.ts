import { PokemonDb } from "./core/pokemon/pokemonDb";
import { SmogonStats } from "./core/smogon/smogonStats";
import pokemonListTemplate from './templates/pokemonItem.hbs';
import userMessageTemplate from './templates/message.hbs';
import { BattleInfo, ResponseMessage } from "./core/extensionModels";
import { SmogonSets } from "./core/smogon/smogonSets";
import { FormatHelper } from "./core/formatHelper";

let communicationDone = false;

// initializes the app
jQuery(function() {
  //getOpponentsTeam();
  
  // debugs
  //displayError("Couldn't find an active battle. Please open a battle tab in Pokemon Showdown first and try again.</br>(Doesn't support random battles yet)")
  displayTeamStats(new BattleInfo("gen8vgc2021", ["Groudon", "Charizard", "Venusaur", "Regieleki", "Porygon2", "Incineroar"]));
  //displayTeamStats(new BattleInfo("gen8ou", ["Slowbro", "Cinderace", "Dragapult", "Dragonite", "Zapdos", "Nidoking"]));
  //displayTeamStats(["Moltres", "Swampert", "Clefable", "Tapu Lele", "Rillaboom", "Magearna"]);
  //displayTeamStats(["Blacephalon", "Urshifu-*", "Jirachi", "Sableye", "Togekiss", "Mamoswine"]);
  //displayTeamStats(new BattleInfo("gen8uu", ["Sylveon", "Scizor", "Zeraora", "Salamence", "Victini", "Latias"]));
});

function getOpponentsTeam() {
  setTimeout(checkShowdownTabAnswer, 3000); // shows error message after 3 seconds

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { operation: "getOpponentsTeam", test: "dfsdf" },
      function (response: ResponseMessage<BattleInfo>) {
        if (response.success) {
          const battleInfo = response.data;
          const anyMonInTheTeam = battleInfo && battleInfo.isValidTeam(); 
          if (!anyMonInTheTeam) {
            displayError("It wasn't possible to load the team. Please refresh the Pokemon Showdown page and try again.")
            return;
          }

          displayTeamStats(battleInfo);
        }
        else {
          displayError(response.errorMessage);
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
                              format: format,
                              usageData: teamMoveset.find(i => i?.name == pkm?.name),
                              sets: SmogonSets.get(pkm, format)
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