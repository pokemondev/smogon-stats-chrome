export interface AppMessage {
  operation: string;
}

export interface ResponseMessage<T> {
  data?: T,
  success: boolean,
  errorType?: ErrorType,
  errorMessage?: string
}

export class ResponseMessageFactory {
  public static createFor<T>(data: T) {
    return { data: data, success: true } as ResponseMessage<T>;
  }
  public static createForError<T>(errorMessage: string) {
    return { success: false, errorMessage: errorMessage } as ResponseMessage<T>;
  }
}

export enum ErrorType {
  NoTeamToShow,
}