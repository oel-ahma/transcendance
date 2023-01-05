import React, {createContext, useReducer, useCallback, useState, useEffect, useContext} from 'react';
import { io, Socket } from 'socket.io-client';
import { protectedFetch } from '../lib/fetchImprove';
import { friendsReducer } from '../reducer/FriendsReducer';
import { User } from './chatContext/chatContextTypes';
import { UserContext, UserContextValue } from './userContext';
export const FriendsContext = createContext<FriendsContextValue | null>(null);

export interface FriendsState {
	friends: Friend[],
}
export interface Friend {
	user: User,
	status: FriendState,
	state: FriendStatus,
}

export interface FriendsContextValue {
	state: FriendsState,
	addFriend: (user: User, onSuccess?: (res: Response)=>void)=>void,
	blockUser: (user: User, onSuccess?: (res: Response)=>void)=>void,
	acceptFriend: (userId: number, onSuccess?: (res: Response)=>void)=>void,
	removeLink: (userId: number, onSuccess?: (res: Response)=>void)=>void,
	getFriendLink: (userId: number)=>FriendStatus | null,
}

export type FriendStatus = 'WAITING' | 'SEND_WAITING' | 'BLOCKED' | 'ACCEPTED' | 'BLOCKED_BY'
export type FriendState = 'ONLINE' | 'OFFLINE' | 'PLAYING'

export interface FriendsActionPayload extends Partial<FriendsState>{
	userId?: number,
	friend?: Friend,
	status?: FriendStatus,
	stateC?: FriendState
}

export interface FriendsAction {
	type: 'ADD_FRIEND' | 'UPDATE_FRIEND' | 'REMOVE_FRIEND' | 'SET_FRIENDS' | 'UPDATE_STATUS',
	payload: Partial<FriendsActionPayload>
}

export const FriendsContextProvider = ( {children}: { children: JSX.Element} ) => {
	const initialeState: FriendsState = {
		friends: []
	}
	const [friendsValue, dispatch] = useReducer(friendsReducer, initialeState)
	const {token, deleteToken, content: user} = useContext(UserContext) as UserContextValue

	/* reducer */
	const setFriends = useCallback(
	(friends: Friend[]) => {
		dispatch({type: "SET_FRIENDS", payload: {friends}
	});
	}, [dispatch])

	const deleteFriendReducer = useCallback(
	(userId: number) => {
		dispatch({type: "REMOVE_FRIEND", payload: {userId}
	});
	}, [dispatch])

	const addFriendReducer = useCallback(
	(friend: Friend) => {
		dispatch({type: "ADD_FRIEND", payload: {friend}
	});
	}, [dispatch])

	const updateFriendReducer = useCallback(
	(userId: number, status: FriendStatus) => {
		dispatch({type: "UPDATE_FRIEND", payload: {userId, status}
	});
	}, [dispatch])

	/* end reducer */

	/* start dl */
	useEffect(()=>{

		protectedFetch({
			token, deleteToken,
			url: '/friends', method: 'GET',
			onSuccess: (res: Response)=>{
				res.json().then((data: any)=>{
					var allFriends: Friend[] = []
					data.forEach((friend: any)=>{
						var nFriend: Friend | null = null
						if (friend.receiver.id === user.id) {
							nFriend = {
								user: {
									id: friend.requester.id,
									name: friend.requester.name,
									avatar: friend.requester.avatar
								},
								state: friend.status,
								status: friend.requester.status
							}
							if (nFriend.state === "BLOCKED")
								nFriend.state = 'BLOCKED_BY'
						}
						else { //user is the receiver!
							nFriend = {
								user: {
									id: friend.receiver.id,
									name: friend.receiver.name,
									avatar: friend.receiver.avatar
								},
								state: friend.status,
								status: friend.receiver.status
							}
							if (nFriend.state === "WAITING")
								nFriend.state = "SEND_WAITING"
						}
						allFriends.push(nFriend)
					})
					setFriends(allFriends)
				})
			}
		})
	}, [token, setFriends, deleteToken, user.id])
	/* end dl */

	/* start actions */
	function addFriend(user: User, onSuccess?: (res: Response)=>void) {
		protectedFetch({
			token, deleteToken,
			url: `/friends/${user.id}`, method: 'POST',
			onSuccess: (res: Response)=>{
				if (res.status === 201) {
					var nFriend: Friend = {user: user, state: 'SEND_WAITING', status: 'OFFLINE'}
					addFriendReducer(nFriend)
				}
				if (onSuccess) onSuccess(res)
			}
		})
	}
	function blockUser(user: User, onSuccess?: (res: Response)=>void) {
		protectedFetch({
			token, deleteToken,
			url: `/friends/${user.id}/block`, method: 'DELETE',
			onSuccess: (res: Response)=>{
				if (res.status === 200) {
					var nFriend: Friend = {user: user, state: 'BLOCKED', status: 'OFFLINE'}
					addFriendReducer(nFriend)
				}
				if (onSuccess) onSuccess(res)
			}
		})
	}
	function acceptFriend(userId: number, onSuccess?: (res: Response)=>void) {
		protectedFetch({
			token, deleteToken,
			url: `/friends/${userId}/accept`, method: 'POST',
			onSuccess: (res: Response)=>{
				if (res.status === 201) { /** @warning 201 must be 200*/
					updateFriendReducer(userId, 'ACCEPTED')
				}
				if (onSuccess) onSuccess(res)
			}
		})
	}
	function removeLink(userId: number, onSuccess?: (res: Response)=>void) {
		protectedFetch({
			token, deleteToken,
			url: `/friends/${userId}`, method: 'DELETE',
			onSuccess: (res: Response)=>{
				if (res.status === 200) {
					deleteFriendReducer(userId)
				}
				if (onSuccess) onSuccess(res)
			}
		})
	}
	/* end actions */
	/* utils */
	function getFriendLink(userId: number): FriendStatus | null {
		var finded = friendsValue.friends.find((friend: Friend)=> friend.user.id === userId)
		if (finded === undefined)
			return null
		return finded.state
	}

	/* socket */
	const [ioFriends, setIoFriends] = useState<Socket<any, any> | null>(null)
	useEffect(()=>{

		if(!ioFriends)
			return

		ioFriends.on("invite", (info: any) => {
			if (!info)
				return
			dispatch({type: 'ADD_FRIEND', payload: {friend: {
				user: {id: info.id, avatar: info.avatar, name: info.name},
				status: info.status,
				state: 'WAITING'
			}}})
		});
		ioFriends.on("new", (info: any) => {
			if (!info)
				return
			dispatch({type: 'UPDATE_FRIEND', payload: {userId: info.id, status: 'ACCEPTED'}})
		});
		ioFriends.on("delete", (info: any) => {
			if (!info)
				return
			dispatch({type: 'REMOVE_FRIEND', payload: {userId: info.id}})
		});
		ioFriends.on('status', (login: number, status: FriendState) => {
			dispatch({type: 'UPDATE_STATUS', payload: {userId: login, stateC: status}})
		})
		return (()=>{
			ioFriends.removeAllListeners()
		})
	}, [ioFriends, setIoFriends, dispatch])

	useEffect(() => {
		if (!token)
			return
		const newIo = io(`${process.env.REACT_APP_BACKEND_URL?.replace('http', 'ws')}/friends`, {auth: { token }})
		setIoFriends(newIo)
		return () => {
			if (ioFriends)
			{
				ioFriends.disconnect()
				setIoFriends(null)
			}
		}
	}, [token])


	const value: FriendsContextValue = {
		state: friendsValue,
		addFriend,
		blockUser,
		acceptFriend,
		removeLink,
		getFriendLink
	}
	return (
		<FriendsContext.Provider value={value}>
			{children}
		</FriendsContext.Provider>
	)
}