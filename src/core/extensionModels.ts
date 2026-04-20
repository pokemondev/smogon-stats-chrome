export interface AppMessage {
  operation: string;
}

export interface ResponseMessage<T> {
  data?: T,
  success: boolean,
  errorType?: ErrorType,
  errorMessage?: string,
  debugInfo?: string[]
}

export class BattleInfo {
  constructor(
    public format: string,
    public opponentTeam: string[],
    public playerTeam: string[] = [],
  ) {
  }

  public isValidTeam(): boolean {
    return this.hasOpponentTeam() || this.hasPlayerTeam();
  }

  public hasOpponentTeam(): boolean {
    return this.opponentTeam && this.opponentTeam.length > 0;
  }

  public hasPlayerTeam(): boolean {
    return this.playerTeam && this.playerTeam.length > 0;
  }

  public hasBothTeams(): boolean {
    return this.hasOpponentTeam() && this.hasPlayerTeam();
  }
}

export class ResponseMessageFactory {
  public static createFor<T>(data: T, debugInfo?: string[]) {
    return { data: data, success: true, debugInfo: debugInfo } as ResponseMessage<T>;
  }
  public static createForError<T>(errorMessage: string, debugInfo?: string[]) {
    return { success: false, errorMessage: errorMessage, debugInfo: debugInfo } as ResponseMessage<T>;
  }
}

export enum ErrorType {
  NoTeamToShow,
}