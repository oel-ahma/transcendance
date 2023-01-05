import React, {createContext, useReducer, useCallback, useContext, useEffect, useState, useMemo} from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import fetchWithToken, { checkToken, protectedFetch } from '../../lib/fetchImprove';
import { Friend, FriendsContext, FriendsContextValue } from '../friendsContext';
import { UserContext, UserContextValue } from '../userContext';
import { channelManagement, channelUserManagement } from './channelManagement';
import { ChatState, ChatValue, MessageType, RoomData, RoomUser, User } from './chatContextTypes';
import { chatDispatcher } from './chatDispatcher';
import { chatNavig, useChatNavigTools } from './chatNavig';
import { chatReducer } from './ChatReducer';
export const ChatContext = createContext<ChatValue | null>(null);

export const ChatProvider = ( {children}: { children: JSX.Element} ) => {
	const initialeState: ChatState = {
		channels: [],
		dmChannels: [],
		rData: null,
		state: {
			location: '/home',
			open: false,
		},
		joinRoomId: 0
	}
	const [chatValue, dispatch] = useReducer(chatReducer, initialeState)
	const {token, deleteToken, content: user} = useContext(UserContext) as UserContextValue
	const {state: {friends}} = useContext(FriendsContext) as FriendsContextValue
	var [searchParams, setSearchParams] = useSearchParams()
	const [loaded] = useState(new Map ([
		['channels', false],
		['privateMessage', false],
	]))

	const allReducers = useMemo(()=>chatDispatcher(dispatch, user), [dispatch, user])
	
	const {
		setChannels,
		addChannel,
		updateChannel,
		removeChannel,
		addMessage,
		setLocation,
		setOpen,
		promoteUserReducer,
		removeUserFromChannelReducer,
		addUserToChannelReducer,
		addPmMessage,
		setPmChannels,
		addPmChannel,
		removePmChannel
	} = allReducers

	// loading minimal data for running
	useEffect(()=>{
		
		checkToken(token, 
		(token: string)=>fetchWithToken<any>({
			token,
		 	deleteToken,
			url: `/channels`, 
			callback: (data: any)=>{
				setChannels(data)
				loaded.set('channels', true)
			}
		}))

		protectedFetch({
			token, deleteToken,
			url: `/dm`,
			onSuccess: (res: any)=>{
				loaded.set('privateMessage', true)
				res.json().then((data: any)=>{
					data = data.map((room: any)=>{
						return {
							id: room.id,
							name: '',
							ownerId: 0,
							type: 'DM',
							messages: room.DMChannelMessage.map((message: any)=>{
								return {
									content: message.content,
									User: message.DMChannelUser.user,
									type: message.type
								}
							}),
							users: room.DMChannelUser.map((message: any)=>{
								return {
									state: 'USER',
									user: message.user
								}
							})
						}
					})
					setPmChannels(data)
				})
			}
		})

	}, [token, deleteToken, loaded, setChannels, setPmChannels])

	/* utils0 */
	function getGradeUser(userId: number) {
		if (!chatValue.rData)
			return null
		if (userId === chatValue.rData.ownerId)
			return 'OWNER'
		var find = chatValue.rData.users.find((user: RoomUser)=> user.user.id === userId)
		if (find)
			return find.state
		return null
	}
	function getGradeColor(userId: number) {
		var grade = getGradeUser(userId)
		if (grade === 'OWNER') return 'blueviolet'
		if (grade === 'ADMIN') return 'red'
		if (grade === 'USER') return 'blue'
		if (grade === 'MUTE') return 'yellow'
		return 'green'
	}


	useEffect(() =>{
		if (loaded.get('channels') === true)
		chatNavig({token, deleteToken, searchParams, setSearchParams, setLocation})
	}, [searchParams, token, deleteToken, setSearchParams, setLocation, loaded])

	/* sockets */
	const [ioChannels, setIoChannels] = useState<Socket<any, any> | null>(null)

	useEffect(()=>{

		if(!ioChannels)
			return
		
		ioChannels.on('message', (info: any) => {
			if (!info.message && !info.User)
				return
			var message: MessageType = {
				content: info.message,
				User: info.user,
				type: info.type ? info.type : 'MESSAGE'
			}
			addMessage(message, info.channel)
		})

		ioChannels.on('dm_message', (info: any) => {

			if (!info.user)
				return
			var message: MessageType = {
				content: info.content ? info.content : info.message,
				User: info.user,
				type: info.type
			}
			addPmMessage(info.DmChannel, message)
		})

		ioChannels.on('join', (info: any) => {
			if (!info)
				return
			addUserToChannelReducer({state: 'USER',user: info.user}, info.channel)
		})

		ioChannels.on('leave', (info: any) => {
			if (!info)
				return
			removeUserFromChannelReducer(info.user.id, info.channel)
		})

		ioChannels.on('delete', (info: any) => {
			removeChannel(info.channel)
		})

		ioChannels.on('action', (info: any) => {
			if (!info)
				return
			var rData: RoomData | undefined = chatValue.channels.find((rData: RoomData) =>
			rData.id === info.channel)
			if (!rData)
			 	return
			promoteUserReducer(info.role, info.user.id, rData)
		})
	
		return (()=>{
			ioChannels.removeAllListeners()
		})
	}, [ioChannels, addMessage, user, addUserToChannelReducer, removeUserFromChannelReducer, chatValue.channels, promoteUserReducer, removeChannel])
	

	useEffect(() => {
		if (!token)
			return
		const newIo = io(`${process.env.REACT_APP_BACKEND_URL?.replace('http', 'ws')}/channels`, {auth: { token }})
		setIoChannels(newIo)
		return () => {
			if (ioChannels)
			{
				ioChannels.disconnect()
				setIoChannels(null)
			}
		}
	}, [token])
	
	const sendMessage = useCallback(
	function sendMessageCallback(message: string) {

		if (ioChannels && chatValue.rData) {
			var id: number = chatValue.rData.id
			ioChannels.emit("message", {
					channel: id,
					message: message
				}, (response: any) => {
					if (response === 'ok')
						addMessage({content: message, User: user, type: 'MESSAGE'}, id)
				});
			}
	}, [ioChannels, chatValue.rData, addMessage, user])

	const sendPrivateMessage = useCallback(
	function sendPrivateMessageCallback(message: string) {

		if (ioChannels && chatValue.rData) {
			var id = user.id
			var roomId = chatValue.rData.id
			var userV = chatValue.rData.users[0].user.id === id ? chatValue.rData.users[1].user
				: chatValue.rData.users[0].user
			
			ioChannels.emit("dm_message", {
				user: userV.id,
				message: message
			}, (response: any) => {
				if (response === 'ok')
					addPmMessage(roomId, {content: message, User: user, type: 'MESSAGE'})
			});
		}
	}, [ioChannels, chatValue.rData, addPmMessage])

	const createPrivateGame = useCallback(
		function createPrivateGameCallback(priv: boolean) {
			return function cb(game: any) {
				if (chatValue.rData && ioChannels) {
					var msg: MessageType = {
						type: 'GAME',
						User: game.players.left.connected as User,
						content: game.id
					}
					var id = chatValue.rData.id
					if (priv) {
						var userV = chatValue.rData.users[0].user.id === user.id ? chatValue.rData.users[1].user
						: chatValue.rData.users[0].user

						ioChannels.emit("dm_game", {
							user: `${userV.id}`,
							game_id: game.id
						})
						addPmMessage(id, msg)
					}
					else {
						ioChannels.emit("game", {
							channel: `${chatValue.rData.id}`,
							game_id: game.id
						})
						addMessage(msg, id)
					}
				}
			}
	}, [chatValue.rData, addPmMessage, addMessage])
	
	const value: ChatValue = {
		content: chatValue,
		loaded: loaded,
		sendMessage,
		sendPrivateMessage,
		setLocation,
		getGradeUser,
		setOpen,
		getGradeColor,
		addChannel,
		updateChannel,
		createPrivateGame,
		...useChatNavigTools({setLocation, setOpen, dmChannels: chatValue.dmChannels,
			token, deleteToken, addPmChannel}),
		...channelUserManagement({token, deleteToken, chatState: chatValue, promoteUserReducer}),
		...channelManagement({token, deleteToken, user, allReducers})
	}
	return (
		<ChatContext.Provider value={value}>
			{children}
		</ChatContext.Provider>
	)
}