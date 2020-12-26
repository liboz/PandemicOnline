import socketIO, { Socket } from "socket.io";
import { Client } from "pandemiccommon/dist/out-tsc";

type EventName = Client.EventName;

export interface ClientWebSocket {
  sendMessageToClient(eventName: EventName, ...args: any[]): boolean;
  sendMessageToAllInRoom(eventName: EventName, ...args: any[]): boolean;
  sendMessageToAllButClient(eventName: EventName, ...args: any[]): boolean;
  on(event: EventName, listener: (...args: any[]) => void): void;
}

export class SocketIOSocket implements ClientWebSocket {
  constructor(
    private io: socketIO.Server,
    private socket: Socket,
    private gameName: string
  ) {}
  sendMessageToAllInRoom(eventName: EventName, ...args: any[]): boolean {
    return this.io.in(this.gameName).emit(eventName, ...args);
  }
  sendMessageToClient(eventName: EventName, ...args: any[]): boolean {
    return this.socket.emit(eventName, ...args);
  }
  sendMessageToAllButClient(eventName: EventName, ...args: any[]): boolean {
    return this.socket.broadcast.to(this.gameName).emit(eventName, ...args);
  }
  on(eventName: EventName, listener: (...args: any[]) => void): void {
    this.socket.on(eventName, listener);
  }
}
