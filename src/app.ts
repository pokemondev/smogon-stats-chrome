import { PokemonDb } from "./core/pokemonDb";
import { SmogonStats } from "./core/smogonStats";
import template from './templates/pokemonItem.hbs';

jQuery(function() {
  getOpponentsTeam();
  //displayTeamStats(["Gallade", "Swampert", "Noivern", "Tapu Lele", "Rillaboom", "Zoroark"]);
  //displayTeamStats(["Blacephalon", "Urshifu-*", "Jirachi", "Sableye", "Togekiss", "Mamoswine"]);
});

function getOpponentsTeam() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { operation: "getOpponentsTeam", test: "dfsdf" },
      function (team: string[]) {
        const anyMonInTheTeam = team && team.length > 0; 
        if (!anyMonInTheTeam) {
          return;
        }
        
        displayTeamStats(team);
    });
  });
}

function displayTeamStats(team: string[]) {
  const pokemonDb = new PokemonDb();
  const smogonStats = new SmogonStats();
  const teamUsageData = team.map(pkmName => ({
                              name: pkmName, 
                              pokemon: pokemonDb.getPokemon(pkmName), 
                              usageData: smogonStats.getMoveSet(pkmName) 
                            }));
  console.log(teamUsageData);
  
  $(".main-list").html(template(teamUsageData));
  $('.collapsible').collapsible();
  $('.tabs').tabs();
}