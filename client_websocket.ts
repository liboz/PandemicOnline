import socketIO, { Socket } from "socket.io";
import { Client } from "types";

type EventName = Client.EventName;

export interface ClientWebSocket {
  sendMessageToClient(eventName: EventName, ...args: any[]): boolean;
  sendMessageToAllInRoom(
    gameName: string,
    eventName: EventName,
    ...args: any[]
  ): boolean;
  sendMessageToAllButClient(
    gameName: string,
    eventName: EventName,
    ...args: any[]
  ): boolean;
  on(event: EventName, listener: (...args: any[]) => void): void;
}

export class SocketIOSocket implements ClientWebSocket {
  constructor(private io: socketIO.Server, private socket: Socket) {}
  sendMessageToAllButClient(eventName: EventName, ...args: any[]): boolean {
    throw new Error("Method not implemented.");
  }

  sendMessageToAllInRoom(
    gameName: string,
    eventName: EventName,
    ...args: any[]
  ): boolean {
    return this.io.in(gameName).emit(eventName, ...args);
  }
  sendMessageToClient(
    gameName: string,
    eventName: EventName,
    ...args: any[]
  ): boolean {
    return this.socket.to(gameName).emit(eventName, ...args);
  }
  on(eventName: EventName, listener: (...args: any[]) => void): void {
    this.socket.on(eventName, listener);
  }
}
