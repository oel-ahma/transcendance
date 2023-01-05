import { ChatAction, ChatState, RoomData, RoomUser } from "./chatContextTypes"

export const chatReducer = (state: ChatState , action: ChatAction ) => {
	const {location, id, user, grade, direction, rData, roomId, roomUser, name} = action.payload
	// if (state.rData)
	// 	state = {...setRoomData(state, state.rData.id)}
		
	if (action.type === 'SET_CHANNELS') {
		if (action.payload.channels)
			state.channels = action.payload.channels
		return {...state}
	}
	else if (action.type === 'ADD_CHANNEL') {
		if (action.payload.channel)
			state.channels.push(action.payload.channel)
		return {...state}
	}
	else if (action.type === 'UPDATE_CHANNEL' && roomId && name) {
		var roomData: RoomData | undefined = state.channels.find((rData: RoomData)=>
		rData.id === roomId)
		if (!roomData)
			return {...state}
		roomData.name = name 
		return {...state}
	}
	else if (action.type === 'REMOVE_CHANNEL') {
		if (id)
		{
			state.channels = state.channels.filter((channel: RoomData)=>
				channel.id !== action.payload.id)
			state = {...setRoomData(state, id)}
		}
		return {...state}
	}
	else if (action.type === 'ADD_USER' && roomUser && roomId) {
		var roomData: RoomData | undefined = state.channels.find((rData: RoomData)=>
		rData.id === roomId)
		if (!roomData)
			return {...state}
		roomData.users.push(roomUser)
		return {...state}
	}
	else if(action.type === 'REMOVE_USER' && id !== undefined && roomId !== undefined) {
		roomData = state.channels.find((rData: RoomData)=>
		rData.id === roomId)
		if (!roomData)
			return {...state}
		roomData.users = roomData.users.filter((value: RoomUser)=> value.user.id !== id)
		return {...state}
	}
	else if (action.type === 'ADD_MESSAGE') {
		if (action.payload.roomId && action.payload.message)
		{
			var r = state.channels.find(room=> room.id === action.payload.roomId)
			if (r)
				r.messages.push(action.payload.message)
		}
		return {...state}
	}
	else if (action.type === 'SET_LOCATION') {
		////////////////////location
		state.state.open = true
		if (location === 'home') {
			state.state.location = 'home'
			state.rData = null
		}
		else if (location === 'room/home' && id) {
			state.state.location = 'room/home'
			state = {...setRoomData(state, id)}
		}
		else if (location === 'room/settings' && id && user) {
			var find = state.channels.find((roomData: RoomData)=> roomData.id === id)
			
			if (find && find.ownerId === user.id) {
				state.state.location = 'room/settings'
				state = {...setRoomData(state, id)}
			}
		}
		else if (location === 'privateMessage' && id) {
			var finded = state.dmChannels.find((value: RoomData)=>value.users[0].user.id === id ||
				value.users[1].user.id === id)
			if (finded) {
				state.state.location = 'privateMessage'
				state.rData = finded
			}
			else {
				state.state.location = 'home'
				state.rData = null
			}
		}
		else if (location === 'joinRoom' && id) {
			state = {...state}
			var finded: RoomData | undefined = state.channels.find(room=> room.id === id)
			if (finded)
			{
				state.rData = finded
				state.state.location = 'room/home'
			}
			else
			{
				state.joinRoomId = id
				state.state.location = 'room/join'
			}
		}
		////////////////////location
		return {...state}
	}
	else if (action.type === 'SET_OPEN') {
		if (typeof(action.payload.direction) === 'boolean') {
			state.state.open = action.payload.direction
		}
		return {...state}
	}
	else if (action.type === 'PROMOTE_USER' && id && grade && rData) {
		var promotedUser = rData.users.find((user: RoomUser)=> user.user.id === id)
		if (promotedUser)
			promotedUser.state = grade
		return {...state}
	}
	else if (action.type === 'SET_PM_CHANNELS') {
		if (action.payload.channels)
			state.dmChannels = action.payload.channels
		return {...state}
	}
	else if (action.type === 'ADD_PM_CHANNEL') {
		if (action.payload.channel)
			state.dmChannels.push(action.payload.channel)
		return {...state}
	}
	else if (action.type === 'ADD_PM_MESSAGE' && id) {
		if (action.payload.message)
		{
			var roomPm = state.dmChannels.find(room=> room.id === id)
			if (roomPm)
				roomPm.messages.push(action.payload.message)
		}
		return {...state}
	}
	else if (action.type === 'REMOVE_PM_CHANNEL' && id) {
		state.dmChannels = state.dmChannels.filter((channel: RoomData)=>channel.id !== id)
		return {...state}
	}
    return state
}

function setRoomData(state: ChatState, id: number): ChatState {
	var finded: RoomData | undefined = state.channels.find(room=> room.id === id)
	if (finded)
		state.rData = finded
	else
	{
		state.state.location = 'home'
		state.rData = null
	}
	return {...state}
}