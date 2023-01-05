import { io } from "socket.io-client";
import { protectedFetch } from "../../lib/fetchImprove";
import { GameMachineContext } from "./gameMachine";

export function fetchData(context: GameMachineContext) {
	return (callback: any) => {
		const newIo = io(`${process.env.REACT_APP_BACKEND_URL?.replace('http', 'ws')}/games`,
		{
			auth: { token: context.token },
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 500
		})

		newIo.on("connect", () => {

			var roomId = context.searchParams.get('roomId')
			if (roomId) {
				callback({type: 'SPECTATING', socket: newIo, roomId: roomId})
				return
			}

			protectedFetch({
				token: context.token,
				deleteToken: context.deleteToken,
				method: 'GET',
				url: '/game/current',
				onSuccess: async (data: Response)=>{
					data.blob().then(async (content) => {
						if (data.ok) {
							if (await content.text() === "false")
								callback({type: 'CONNECTED', socket: newIo})
							else {
								// Récupération du token de la game depuis ici
								// const gameId = await content.text()
								callback({type: 'IN_GAME', socket: newIo})
							}
						}
					})
				}
			})
		});
		return ()=>newIo.removeListener('connect')
	}
}

export function waitingPrivateGame(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.emit("new", {
			match_making: "false",
		}, (game: any) => {
			if (event.createPrivateGame)
				event.createPrivateGame(game)
		});

		socket.on("start", (game: any) => {
			if (game.status === 'start')
			{
				socket.removeListener('start')
				event.goToGame()
				callback({type: 'FOUND', data: {
					player: game.players.left.connected,
					opponent: game.players.right.connected,
					gameState: game
				}})
			}
		})
		return () => {
			socket.removeListener('start')
		}
	}
}

export function joiningPrivateGame(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.emit("join", {
			room: event.roomId,
			spectate: "false",
		}, (game: any) => {
			if (game === false)
				callback('FAIL')
			if (game.type === 'spectator')
			{
				event.goToGame()
				var aGame = game.game
				callback({type: 'FULL', data: {
					player: aGame.players.left.connected,
					opponent: aGame.players.right.connected,
					gameState: aGame
				}})
			}
		});

		socket.on("start", (game: any) => {
			if (game.status === 'start')
			{
				socket.removeListener('start')
				event.goToGame()
				callback({type: 'SUCCESS', data: {
					player: game.players.left.connected,
					opponent: game.players.right.connected,
					gameState: game
				}})
			}
		})
		
		return () => {
			socket.removeListener('start')
		}
	}
}

export function reconnectToGame(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.on("heartbeat", (game: any) => {
			callback({type: 'SUCCESS', data: {
				player: game.players.left.connected,
				opponent: game.players.right.connected,
				gameState: game
			}})
		})
		socket.on("game_over", (game: any) => {
			callback({type: 'GAME_OVER', game: game})
		})
		
		return () => {
			socket.removeListener('heartbeat')
			socket.removeListener('game_over')
		}
	}
}

export function joinPublicQueue(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.emit('new', {match_making: 'true', game_mode: event.gameMode});

		socket.on("start", (game: any) => {
			if (game.status === 'start')
			{
				socket.removeListener('start')
				callback({type: 'FOUND', data: {
					player: game.players.left.connected,
					opponent: game.players.right.connected,
					gameState: game
				}})
			}
		})
		
		return () => {
			socket.removeListener('start')
		}
	}
}

export function joinAsSpectator(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.emit("join", {
			room: event.roomId,
			spectate: "true",
		}, (game: any) => {
			if (game) {
				callback({
					type: 'SUCCESS',
					data: {
						player: game.players.left.connected,
						opponent: game.players.right.connected,
						gameState: game
					}
				})
			}
			else {
				callback('FAIL')
			}
		});
		
		return () => {}
	}
}

export function lookForGameEvents(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.on("pause", () => {
			callback('ENNEMY_DISCONNECT')
		})
		socket.on("game_over", (game: any) => {
			callback({type: 'GAME_OVER', game: game})
		})
		
		return () => {
			socket.removeListener('pause')
			socket.removeListener('game_over')
		}
	}
}

export function lookForResume(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.on("resume", (game: any) => {
			callback({type: 'RECONNECTION', game: game})
		})
		
		return () => socket.removeListener('resume')
	}
}

export function lookForDisconnect(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.on("disconnect", () => {
			callback('DISCONNECT')
		})
		
		return () => socket.removeListener('disconnect')
	}
}

export function lookForGameOver(context: GameMachineContext, event: any) {
	return (callback: any) => {
		var socket = context.socket
		socket.on("game_over", (game: any) => {
			callback({type: 'GAME_OVER', game: game})
		})
		
		return () => socket.removeListener('game_over')
	}


}

export function reconnectSocket(context: GameMachineContext) {
	return (callback: any) => {
		var socket = context.socket

		socket.on("connect", () => {
			var roomId = context.searchParams.get('roomId')
			if (roomId) {
				callback({type: 'SPECTATING', socket: socket, roomId: roomId})
				return
			}

			protectedFetch({
				token: context.token,
				deleteToken: context.deleteToken,
				method: 'GET',
				url: '/game/current',
				onSuccess: async (data: Response)=>{
					data.blob().then(async (content) => {
						if (data.ok) {
							if (await content.text() === "false")
								callback({type: 'CONNECTED', socket: socket})
							else {
								// Récupération du token de la game depuis ici
								// const gameId = await content.text()
								callback({type: 'IN_GAME', socket: socket})
							}
						}
					})
				}
			})
		});
		return () => socket.removeListener('connect')
	}
}