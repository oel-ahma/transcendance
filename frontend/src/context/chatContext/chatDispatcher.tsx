import { ConnectedUser, MessageType, RoomData, RoomUser } from "./chatContextTypes";

export interface AllReducers {
	removeChannel: (id:number)=>void,
	addChannel: (rData: RoomData)=>void
}

export function chatDispatcher(dispatch: any, user: ConnectedUser) {

	function setChannels(channels: RoomData[]) {
		dispatch({type: "SET_CHANNELS", payload: {channels}})
	}
	
	function addChannel(channel: RoomData) {
		dispatch({type: "ADD_CHANNEL", payload: {channel}})
	}

	function updateChannel(name: string, roomId: number) {
		dispatch({type: "UPDATE_CHANNEL", payload: {name, roomId}})
	}
	
	function removeChannel(id: number) {
		dispatch({type: "REMOVE_CHANNEL", payload: {id}})
	}
	
	function addMessage(message: MessageType, roomId: number) {
		dispatch({type: "ADD_MESSAGE", payload: {message, roomId}})
	}
	
	function setLocation(location: string, id?: number | undefined) {
		dispatch({type: "SET_LOCATION", payload: {location, id, user}})
	}
	
	function setOpen(direction: boolean) {
		dispatch({type: "SET_OPEN", payload: {direction}});
	}
	
	function promoteUserReducer(grade: string, id: number, rData: RoomData) {
		dispatch({type: "PROMOTE_USER", payload: {grade, id, rData}});
	}
	
	function removeUserFromChannelReducer(userId: number, roomId: number) {
		dispatch({type: "REMOVE_USER", payload: {id: userId, roomId: roomId}});
	}
	
	function addUserToChannelReducer(roomUser: RoomUser, roomId: number) {
		dispatch({type: "ADD_USER", payload: {roomUser: roomUser, roomId}});
	}
	
	function addPmMessage(id: number, message: MessageType) {
		dispatch({type: "ADD_PM_MESSAGE", payload: {message, id}});
	}
	
	function setPmChannels(channels: RoomData[]) {
		dispatch({type: "SET_PM_CHANNELS", payload: {channels}});
	}

	function addPmChannel(channel: RoomData) {
		dispatch({type: "ADD_PM_CHANNEL", payload: {channel}});
	}

	function removePmChannel(id: number) {
		dispatch({type: "REMOVE_PM_CHANNEL", payload: {id}});
	}

	function joinRoom(rData: RoomData) {
		dispatch({type: "JOIN_ROOM", payload: {rData}})
	}

	return {
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
		removePmChannel,
		joinRoom
	}
}