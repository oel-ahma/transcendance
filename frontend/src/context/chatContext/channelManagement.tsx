import { protectedFetch } from "../../lib/fetchImprove"
import { ChatState, ConnectedUser, RoomData } from "./chatContextTypes"
import { AllReducers } from "./chatDispatcher"

export function channelManagement({token, deleteToken, user, allReducers}:
{token: string | null, deleteToken: ()=>void, user: ConnectedUser, allReducers: AllReducers})
{
	const {removeChannel, addChannel} = allReducers

	function leaveChannel(id: number, callback?: (data: any)=>void) {
		protectedFetch({
			token, deleteToken,
			url: `/channels/${id}/leave`, method: 'DELETE',
			onSuccess: (res: Response)=>{
				removeChannel(id)
				if (callback) callback(res)
			}
		})
	}
	
	function createChannel(callback: (data: Response)=>void) {
		var name = 'nice room'
		var type = 'PUBLIC'
		var password = ''
		protectedFetch({
			token, deleteToken,
			url: `/channels`, method: 'POST',
			body: {name, type, password},
			onSuccess: (res: Response)=>{
				res.json().then(data=>{
					var nRoom: RoomData = {
						id: data.id,
						name: name,
						type: type,
						messages: [],
						ownerId: user.id,
						users: [{state: 'ADMIN',user: user}]
					}
					addChannel(nRoom)
					callback(res)
				})
			}
		})
	}
	
	function deleteChannel(id: number,
	onSuccess?: (statusCode: number, message: string)=>void,
	onFail?: (err: any)=>void)
	{
		protectedFetch({
			token, deleteToken,
			url: `/channels/${id}`,
			method: 'DELETE',
			onSuccess: (res: Response)=>{
				if (res.status === 200)
					removeChannel(id)
				if (onSuccess) onSuccess(res.status, res.statusText)
			},
			onFail: onFail
		})
	}
		
	return {
		createChannel,
		leaveChannel,
		deleteChannel
	}
}

export function channelUserManagement({token, deleteToken, chatState, promoteUserReducer}:
{token: string | null, deleteToken:()=>void, chatState: ChatState,
promoteUserReducer: any})
{
	function updateRole(userId: number, role: string, date?: Date) {
		if (!chatState?.rData)
			return
		var rData: RoomData = chatState?.rData
		
		protectedFetch({
			token, deleteToken,
			url: `/channels/${rData.id}/role`, method: 'PUT',
			body: {userID: userId, role: role, userId, until: !date ? '' : date.toISOString()},
			onSuccess: (res: Response)=>{
				if (res.status === 200 && rData !== null)
					promoteUserReducer(role, userId, rData)
			}
		})
	}
	function promoteUser(userId: number, dir: boolean) {
		updateRole(userId, dir ? 'ADMIN' : 'USER')
	}
	function banUser(userId: number, dir: boolean) {
		updateRole(userId, dir ? 'BAN' : 'USER', new Date())
	}
	function muteUser(userId: number, dir: boolean) {
		updateRole(userId, dir ? 'MUTE' : 'USER', new Date())
	}
	function resetGrade(userId: number) {
		updateRole(userId, 'USER', new Date())
	}

	return {
		updateRole,
		promoteUser,
		banUser,
		muteUser,
		resetGrade
	}
}