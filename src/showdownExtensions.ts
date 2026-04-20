/// <reference types="chrome" />

import { AppMessage, BattleInfo, ResponseMessageFactory } from "./core/extensionModels";

export class ShowdownExtensions {
  
  public static initialize(): void {
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      const appMsg = message as AppMessage;
      const response = ShowdownExtensions.executeOperation(appMsg.operation);
      console.log(response)
      if (response !== undefined) {
        sendResponse(response);
      }
    });
  }

  public static getOpponentsTeam() {
    const debugInfo: string[] = [];
    
    const currentBattleRoomId = ShowdownExtensions.getCurrentBattleRoomId();
    if (!currentBattleRoomId) {
      debugInfo.push(`roomId=${currentBattleRoomId || "(missing)"}`);
      return ResponseMessageFactory.createForError("Couldn't find an active battle. Please open a battle tab in Pokemon Showdown first and try again.\n(Doesn't support random battles yet)", debugInfo);
    }

    const format = ShowdownExtensions.getFormatFromRoomId(currentBattleRoomId);
    if (!format) {
      debugInfo.push(`format=${format || "(missing)"}`);
      return ResponseMessageFactory.createForError("Couldn't determine the battle format from the active Showdown room.", debugInfo);
    }

    const roomContainer = document.getElementById(`room-${currentBattleRoomId}`);
    if (!roomContainer) {
      return ResponseMessageFactory.createForError("Couldn't locate the active battle room in Pokemon Showdown. Please refresh the page and try again.", debugInfo);
    }

    const participantNames = ShowdownExtensions.getParticipantNames();
    const playerName = participantNames[0];
    const opponentName = participantNames[1];

    if (!playerName)
      return ResponseMessageFactory.createForError("Couldn't identify the player in the active battle. Please refresh the page and try again.", debugInfo);
    
    if (!opponentName)
      return ResponseMessageFactory.createForError("Couldn't identify the opponent in the active battle. Please refresh the page and try again.", debugInfo);

    const opponentTeam = ShowdownExtensions.getParticipantTeam(roomContainer, opponentName);
    if (!opponentTeam || opponentTeam.length === 0) {
      debugInfo.push(`opponentTeamSize=${opponentTeam ? opponentTeam.length : 0}`);
      return ResponseMessageFactory.createForError("Couldn't read the opponent team from the active battle log. Please refresh the page and try again.\n(Doesn't support random battles yet)", debugInfo);
    }

    const playerTeam = ShowdownExtensions.getParticipantTeam(roomContainer, playerName);
    if (!playerTeam || playerTeam.length === 0) {
      debugInfo.push(`playerTeamSize=${playerTeam ? playerTeam.length : 0}`);
      return ResponseMessageFactory.createForError("Couldn't read the player team from the active battle log. Please refresh the page and try again.\n(Doesn't support random battles yet)", debugInfo);
    }

    console.log("[Smogon Stats] Room:", currentBattleRoomId);
    console.log("[Smogon Stats] Teams:", { playerTeam, opponentTeam, debugInfo });
    return ResponseMessageFactory.createFor(new BattleInfo(format, opponentTeam, playerTeam), debugInfo);
  }

  public static executeOperation(operation: string): unknown {
    const operationHandler = (this as unknown as Record<string, unknown>)[operation];
    return typeof operationHandler === "function"
      ? (operationHandler as () => unknown)()
      : undefined;
  }

  private static getCurrentBattleRoomId(): string | undefined {
    const activeRoomTab = document.querySelector("div.tabbar.maintabbar a.roomtab.button.cur") as HTMLAnchorElement;
    const href = activeRoomTab?.getAttribute("href");
    return href
      ? href.replace(/^\//, "")
      : undefined;
  }

  private static getFormatFromRoomId(roomId: string): string | undefined {
    const roomIdParts = roomId.split("-");
    return roomIdParts.length > 1
      ? roomIdParts[1]
      : undefined;
  }

  private static getParticipantNames(): string[] {
    const roomTabParticipantsText = ShowdownExtensions.getActiveRoomTabParticipantsText();
    const namesFromTab = ShowdownExtensions.getParticipantNamesFromRoomTab(roomTabParticipantsText);
    return namesFromTab
  }

  private static getActiveRoomTabParticipantsText(): string | undefined {
    const activeRoomTabSpan = document.querySelector("div.tabbar.maintabbar a.roomtab.button.cur span") as HTMLSpanElement;
    return ShowdownExtensions.normalizeText(activeRoomTabSpan?.textContent);
  }

  private static getParticipantNamesFromRoomTab(roomTabText: string | undefined): string[] {
    if (!roomTabText) {
      return [];
    }

    const versusIndex = roomTabText.toLowerCase().indexOf(" vs. ");
    if (versusIndex < 0) {
      return [];
    }

    const leftSegment = roomTabText.slice(0, versusIndex).trim();
    const rightSegment = roomTabText.slice(versusIndex + 5).trim();
    return [
      ShowdownExtensions.getTrailingToken(leftSegment) ?? "",
      ShowdownExtensions.getLeadingToken(rightSegment) ?? ""
    ];
  }

  private static getTrailingToken(text: string): string | undefined {
    const parts = text.split(/\s+/).filter(part => !!part);
    return parts.length > 0
      ? parts[parts.length - 1].replace(/[✕×xX]+$/, "")
      : undefined;
  }

  private static getLeadingToken(text: string): string | undefined {
    const parts = text.split(/\s+/).filter(part => !!part);
    return parts.length > 0
      ? parts[0].replace(/^[✕×xX]+/, "")
      : undefined;
  }

  private static getParticipantTeam(roomContainer: HTMLElement, participantName: string): string[] | undefined {
    const historyEntries = Array.from(
      roomContainer.querySelectorAll("div.battle-log div.inner.message-log div.chat.battle-history")
    ) as HTMLElement[];

    for (const historyEntry of historyEntries) {
      const lines = ShowdownExtensions.getTextLines(historyEntry);
      const nameLineIndex = lines.findIndex(line => line.indexOf(participantName) >= 0);
      if (nameLineIndex < 0) {
        continue;
      }

      const teamLine = ShowdownExtensions.findTeamLine(lines, nameLineIndex);
      const team = ShowdownExtensions.parseTeamLine(teamLine);
      if (team.length > 0) {
        return team;
      }
    }

    return undefined;
  }

  private static getTextLines(element: HTMLElement): string[] {
    const text = element.innerText || element.textContent || "";
    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  private static findTeamLine(lines: string[], nameLineIndex: number): string | undefined {
    for (let index = nameLineIndex + 1; index < lines.length; index++) {
      if (ShowdownExtensions.looksLikeTeamLine(lines[index])) {
        return lines[index];
      }
    }

    return lines.find(line => ShowdownExtensions.looksLikeTeamLine(line));
  }

  private static looksLikeTeamLine(line: string): boolean {
    if (!line || line.indexOf("/") < 0) {
      return false;
    }

    return line.split("/").filter(part => part.trim().length > 0).length > 1;
  }

  private static parseTeamLine(teamLine: string | undefined): string[] {
    if (!teamLine) {
      return [];
    }

    return teamLine
      .split("/")
      .map(part => part.trim())
      .filter(part => part.length > 0);
  }

  private static normalizeText(text: string | null | undefined): string {
    return (text || "")
      .replace(/\s+/g, " ")
      .trim();
  }
}
ShowdownExtensions.initialize();