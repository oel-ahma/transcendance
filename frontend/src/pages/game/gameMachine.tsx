import { createMachine, assign } from 'xstate'
import { User } from '../../context/chatContext/chatContextTypes'
import { fetchData, joinAsSpectator, joiningPrivateGame, joinPublicQueue, lookForDisconnect, lookForGameEvents, lookForGameOver, lookForResume, reconnectSocket, reconnectToGame, waitingPrivateGame } from './functionGameMachine';

export interface GameMachineContext {
	player: null | User,
	opponent: null | User,
	socket: null | any,
	token: null | string,
	deleteToken: ()=>void,
	playerId: number,
	gameState: any,
	searchParams: any
}

const roomStates = {
	room: {
		initial: 'play_session',
		states: {
			play_session: {
				on: {
					ENNEMY_DISCONNECT: { target: "pause" },
					GAME_OVER: {
						target: '#Game.connected.end_game',
						actions: assign<GameMachineContext, any>({
							gameState: (context: GameMachineContext, event: any) => event.game,
						})
				 	}
				},
				invoke: {
					src: lookForGameEvents,
				}
			},
			pause: {
				on: {
					RECONNECTION: {
						target: "play_session",
						actions: assign<GameMachineContext, any>({
							gameState: (context: GameMachineContext, event: any) => event.game,
						})
					},
				},
				after: {
					10000: {
						target: '#Game.connected.end_game',
						actions: assign<GameMachineContext, any>({
							gameState: (context: GameMachineContext, event: any) => {
								if (context.gameState.players.left.connected.id === context.playerId) {
									context.gameState.players.left.points = 5;
									context.gameState.players.right.points = 0;
								} else {
									context.gameState.players.left.points = 0;
									context.gameState.players.right.points = 5;
								}
								return context.gameState;
							},
						})
					},
				},
				invoke: {
					src: lookForResume,
				}
			},
		},
	},
}

const spectateRoomStates = {
	spectateRoom: {
		initial: 'loading',
		states: {
			loading: {
				on: {
					SUCCESS: {target: 'look', actions: 'setGameState'},
					FAIL: { target: '#Game.connected.idle' }
				},
				invoke: {
					src: joinAsSpectator,
				}
			},
			look: {
				on: {
					GAME_OVER: {
						target: '#Game.connected.end_game',
						actions: assign<GameMachineContext, any>({
							gameState: (context: GameMachineContext, event: any) => event.game,
						})
					},
					LEAVE: { target: '#Game.connected.idle', actions: 'leaveSocketEvent' }
				},
				invoke: {
					src: lookForGameOver,
				}
			},
		},
	}
}

export const gameMachine = createMachine({
	predictableActionArguments: true,
	id: 'Game',
	initial: 'prefetch',
	tsTypes: {} as import("./gameMachine.typegen").Typegen0,
	schema: {
		context: {} as GameMachineContext
	},
	context: {
		player: null,
		opponent: null,
		socket: null,
		token: null,
		deleteToken: ()=>{},
		playerId: 0,
		gameState: null,
		searchParams: null
	},
	exit(context, event, meta) {
		var socket = context.socket
		if (!socket)
			return
		socket.emit('leave')
		socket.disconnect()
	},
	states: {
		prefetch: {
			on: {
				FEED_TOKEN: {
					target: 'fetch',
					actions:  assign<any, any>({
						token: (context: any, event: any) => event.token,
						deleteToken: (context: any, event: any) => event.deleteToken,
						playerId: (context: any, event: any) => event.playerId,
						searchParams: (context: any, event: any) => event.searchParams
					})
				},
			}
		},
		fetch: {
			on: {
				CONNECTED: { target: 'connected.idle', actions: 'assignSocket' },
				IN_GAME: { target: 'connected.reconnect', actions: 'assignSocket' },
				SPECTATING: { 
					target: 'connected.spectateRoom.loading',
					roomId: 'qweqw',
					actions: 'assignSocket'
				} as any,
				FAIL: { target: 'error' }
			},
			invoke: {
				src: fetchData
			}
		},
		error: {
		},
		connected: {
			invoke: {
				src: lookForDisconnect,
			},
			on: {
				DISCONNECT: {target: 'connected.trouble_connection'}
			},
			states: {
				trouble_connection: {
					on: {
						CONNECTED: { target: 'idle', actions: 'assignSocket' },
						IN_GAME: { target: 'reconnect', actions: 'assignSocket' },
						SPECTATING: { 
							target: 'spectateRoom.loading',
							roomId: 'qweqw',
							actions: 'assignSocket'
						} as any,
					},
					invoke: {
						src: reconnectSocket
					}
				},

				idle: {
					on: {
						PLAY: { target: "matchmaking" },
						PRIVATE_PLAY: { target: "private_waiting" },
						PRIVATE_JOIN: { target: "private_joining" },
					},
				},
				reconnect: {
					on: {
						FAIL: {target: 'idle'},
						SUCCESS: {target: 'room',actions: 'setGameState'},
						GAME_OVER: {
							target: '#Game.connected.end_game',
							actions: assign<GameMachineContext, any>({
								gameState: (context: GameMachineContext, event: any) => event.game,
							})
						}
					},
					invoke: {
						src: reconnectToGame,
					}
				},
		
				
				matchmaking: {
					on: {
						CANCEL: {target: "idle", actions: 'leaveSocketEvent'},
						FOUND: {target: 'room', actions: 'setGameState'}
					},
					invoke: {
						src: joinPublicQueue,
					}
				},
		
				private_waiting: {
					on: {
						CANCEL: { target: "idle", actions: 'leaveSocketEvent' },
						FOUND: { target: 'room', actions: 'setGameState' }
					},
					invoke: {
						src: waitingPrivateGame
					}
				},
				private_joining: {
					on: {
						SUCCESS: { target: 'room',actions: 'setGameState' },
						FAIL: { target: 'idle' },
						FULL: {target: 'spectateRoom.look', actions: 'setGameState' }
					},
					invoke: {
						src: joiningPrivateGame
					}
				},
		
		
				end_game: {
					on: {
						OK: 'idle',
					},
					invoke: {
						src: (context) => () => context.socket.emit("leave")
					}
				},
		
		
				...roomStates,
				...spectateRoomStates
			}
		}
	}
}, {
	actions: {
		'setGameState': assign<GameMachineContext, never>({
				player: (_: any, event: any) => event.data.player,
				opponent: (_: any, event: any) => event.data.opponent,
				gameState: (_: any, event: any) => event.data.gameState
		}),
		'leaveSocketEvent': (context: GameMachineContext)=>{
			context.socket.emit("leave");
		},
		'assignSocket': assign<GameMachineContext, never>({
			socket: (_: any, event: any) => event.socket,
		}),
	}
})