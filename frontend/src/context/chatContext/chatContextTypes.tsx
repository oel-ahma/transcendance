export interface RoomData {
	id: number,
	name: string,
	messages: MessageType[],
	ownerId: number,
	type: string,
	users: RoomUser[]
}
export interface RoomPublicData {
	id: number,
	type: "PUBLIC" | "PRIVATE" | "PROTECTED",
	name: string
}
export interface RoomDataPm {
	id: number,
	messages: MessageType[],
	talkUser: User	
}
export interface RoomUser {
	state: string,
	user: User
}
export interface User {
	avatar: string,
	id: number,
	name: string,
}
export interface ConnectedUser extends User {
	otp_enable: boolean
}
export interface MessageType {

	type: 'GAME' | 'MESSAGE',
	User: User,
	content: string,
}

export interface ChatState {
	channels: RoomData[],
	dmChannels: RoomData[],
	rData: RoomData | null,
	joinRoomId: number,
	state: {
		location: string,
		open: boolean,
	}
}

export interface ChatValue {

	content: ChatState,
	createChannel: (a: (a:Response)=>void)=>void,
	loaded: Map<string, boolean>,
	sendMessage: (message: string)=>void,
	sendPrivateMessage: (message: string)=>void,
	setLocation: (location: string, id?: number | undefined)=>void,
	leaveChannel: (id: number, callback?: (data: any)=>(void))=>void
	deleteChannel: (id: number, callback?: (statusCode: number, statusText: string)=>(void))=>void,
	setOpen: (direction: boolean)=>void,
	chatLink: (location: string, qParams?: string)=>void,
	openPrivateMessage: (userId: number)=>void,
	getGradeUser: (userId: number)=>string | null,
	getGradeColor: (userId: number)=>string,
	promoteUser: (userId: number, dir: boolean)=>void,
	resetGrade: (userId: number)=>void,
	muteUser: (userId: number, dir: boolean)=>void,
	banUser: (userId: number, dir: boolean)=>void,
	addChannel: (channel: RoomData)=>void
	updateChannel: (name: string, roomId: number)=>void,
	createPrivateGame: (priv: boolean)=>void
}

interface PayloadChatAction extends ChatState {
	
	roomId: number | null
	roomUser: RoomUser,
	channel: any,
	message: MessageType,
	messages: MessageType[],
	location: string,
	id: number,
	user: ConnectedUser,
	direction: boolean,
	grade: string,
	name: string
}

export interface ChatAction {

	type: string,
	payload: Partial<PayloadChatAction>
}