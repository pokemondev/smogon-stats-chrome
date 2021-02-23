import { AppMessage, BattleInfo, ResponseMessageFactory } from "./core/extensionModels";

export class ShowdownExtensions {
  
  public static initialize(): void {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      const appMsg = message as AppMessage;
      const response = ShowdownExtensions.executeOperation(appMsg.operation);
      console.log(response)
      const shouldSendResponse = ShowdownExtensions.isSet(response) && ShowdownExtensions.isSet(sendResponse);
      if (shouldSendResponse) {
        sendResponse(response);
      }
    });
  }

  public static getOpponentsTeam() {
    const currentBattleRoomId = $("div.tabbar.maintabbar a.roomtab.button.cur").attr("href").replace("/", "");
    console.log(currentBattleRoomId);
    const validBattleRoomId = currentBattleRoomId && currentBattleRoomId.length > 0;
    if (validBattleRoomId) {
      const opponentName = $(`#room-${currentBattleRoomId} div.battle div.rightbar`).text();
      const battleTeams = $(`#room-${currentBattleRoomId} div.battle-log div.inner.message-log div.chat.battle-history`);
      const opponentTeamText = battleTeams.toArray().find(t => t.innerText.includes(opponentName)).innerText;
      console.log("Team:" + opponentTeamText);

      const format = currentBattleRoomId.split("-")[1];
      const opponentTeam = opponentTeamText.split("\n")[1]?.split("/")?.map(i => i.trim());
      return ResponseMessageFactory.createFor(new BattleInfo(format, opponentTeam));
    }
    
    return ResponseMessageFactory.createForError("Couldn't find an active battle. Please open a battle tab in Pokemon Showdown first and try again.\n(Doesn't support random battles yet)");
  }

  public static executeOperation(operation: string): string | void {
    var containsOperation = Object.keys(this).some(k => k == operation);
    return containsOperation
      ? this[operation]()
      : undefined;
  }
  
  private static isSet(arg: any): boolean { 
    return arg ? true : false 
  };
}
ShowdownExtensions.initialize();