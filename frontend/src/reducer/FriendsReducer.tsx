import { ChatAction, ChatState, RoomData } from "../context/chatContext/chatContextTypes"
import { Friend, FriendsAction, FriendsState } from "../context/friendsContext"

export const friendsReducer = (state: FriendsState , action: FriendsAction) => {
	const {friends, userId, friend, status, stateC} = action.payload
	if (action.type === 'SET_FRIENDS') {
		if (friends)
			state.friends = friends
		return {...state}
	}
	if (action.type === 'REMOVE_FRIEND' && userId) {
		if (userId)
			state.friends = state.friends.filter((friend: Friend)=>friend.user.id !== userId)
		return {...state}
	}
	if (action.type === 'ADD_FRIEND' && friend) {
		if (friend)
			state.friends.push(friend)
		return {...state}
	}
	if (action.type === 'UPDATE_FRIEND' && status && userId) {
		if (userId && status) {
			var find = state.friends.find((friend: Friend)=> friend.user.id === userId)
			if (find)
				find.state = status
		}
		return {...state}
	}
	if (action.type === 'UPDATE_STATUS' && stateC && userId) {
		state.friends = state.friends.map((friend: Friend)=> {
			if (friend.user.id === userId)
				friend.status = stateC
			return friend
		})
		return {...state}
	}
    return state
}