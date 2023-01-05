// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.after(10000)#Game.connected.room.pause": {
      type: "xstate.after(10000)#Game.connected.room.pause";
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    services: never;
    guards: never;
    delays: never;
  };
  eventsCausingActions: {
    assignSocket: "CONNECTED" | "IN_GAME" | "SPECTATING";
    leaveSocketEvent: "CANCEL" | "LEAVE";
    setGameState: "FOUND" | "FULL" | "SUCCESS";
  };
  eventsCausingServices: {};
  eventsCausingGuards: {};
  eventsCausingDelays: {};
  matchesStates:
    | "connected"
    | "connected.end_game"
    | "connected.idle"
    | "connected.matchmaking"
    | "connected.private_joining"
    | "connected.private_waiting"
    | "connected.reconnect"
    | "connected.room"
    | "connected.room.pause"
    | "connected.room.play_session"
    | "connected.spectateRoom"
    | "connected.spectateRoom.loading"
    | "connected.spectateRoom.look"
    | "connected.trouble_connection"
    | "error"
    | "fetch"
    | "prefetch"
    | {
        connected?:
          | "end_game"
          | "idle"
          | "matchmaking"
          | "private_joining"
          | "private_waiting"
          | "reconnect"
          | "room"
          | "spectateRoom"
          | "trouble_connection"
          | {
              room?: "pause" | "play_session";
              spectateRoom?: "loading" | "look";
            };
      };
  tags: never;
}
