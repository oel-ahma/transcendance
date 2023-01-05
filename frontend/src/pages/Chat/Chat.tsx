import { useContext, useEffect, useState } from 'react'
import ModalBox from '../../component/ModalBox';
import menu from '../../images/menu.svg'
import useContextMenu from '../../lib/generateMenu';
import ChatUi from './Message';
import { ChannelParameter } from './Settings';
import AllChannel, { CreateServerModal, InformationalModal } from './AllChannel';
import { ChatValue, RoomData, User } from '../../context/chatContext/chatContextTypes';
import { ChatContext } from '../../context/chatContext/chatContext';
import { BACKEND_HOSTNAME } from '../../envir';
import { useRoomSettingsTools } from '../../context/userMenu';
import { RoomUsers } from './Room';
import { UserContext, UserContextValue } from '../../context/userContext';
import { ChannelJoin } from './JoinChannel';
import { FriendList } from './FriendList';

export function ChannelContextMenu({ children, channel, isOnClick=false, roomData }:
{ children: JSX.Element, channel: string, isOnClick?: boolean, roomData: RoomData }) {

	const {leaveChannel} = useContext(ChatContext) as ChatValue

	/* modals */
	const [leaveModal, setLeaveModal] = useState<boolean>(false)
	const [invitationModal, setInvitationModal] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const generateMenu = useContextMenu([...useRoomSettingsTools({rData: roomData, 
		setInvitationModal, setLeaveModal})])

	useEffect(()=>{
		if (leaveModal === false)
			setError(null)		
	}, [leaveModal])

	function onClickLeaveChannel() {
		setIsLoading(true)
		leaveChannel(roomData.id, (data: any)=>{
			setIsLoading(false)
			if (data.status === 200)
				setLeaveModal(false)
			else
				setError(data.message)
		})
	}
	return (
		<div onContextMenu={(e)=>generateMenu(e)} onClick={(e)=>{
			if (isOnClick) generateMenu(e)
		}}>
			<CreateServerModal modal={leaveModal} setModal={setLeaveModal}
				isLoading={isLoading} error={error}
				onCreate={onClickLeaveChannel} message={`Do you really want to leave "${roomData.name}"?`}
				title={'Leave room'} />
			<InformationalModal
				modal={invitationModal}
				setModal={setInvitationModal}
				title={'Invitation'}
				message={`${process.env.REACT_APP_URL}?joinRoomId=${roomData.id}`}
			/>
			{children}
		</div>
	)
}

// interface Room {
// 	name: string
// }

export function getWindowDimensions() {
	const { innerWidth: width, innerHeight: height } = window;
	return {
		width,
		height
	};
}

function Loader({loaded}: {loaded: Map<string, boolean>}) {

	var load = 0
	var total = 0
	for (let l of loaded.values()) {
		if(l)
			++load
		++total
	}
	return (
		<div style={{
			fontSize: '40px',
			width: '100%',
			height: '100%',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			flexDirection: 'column'
		}}>
			<div>loading</div>
			<div>{load}/{total}</div>
		</div>
	)
}

export default function Chat() {

	const {content: {rData, state: {location}}, loaded} = useContext(ChatContext) as ChatValue

	function isFullLoad() {
		for (var value of loaded.values()) {
			if (!value)
				return false
		}
		return true
	}

	return (
		<ModalBox noTop={true}>
			<div className='Chat'>
				{!isFullLoad() ?
				<Loader loaded={loaded}/>
				:
				<>
					<AllChannel />
					
					<div className='Chat__right'>
						
						{getChannelRoute(location, rData)}
					</div>
				</>}
			</div>
		</ModalBox>
	)
}
function ChannelHeader({rData}: {rData: RoomData}) {

	return <ChannelContextMenu channel={'channel name'} isOnClick={true} roomData={rData}>
		<div className='Chat__right__roomName'>
			{rData.name}
			<img className='Chat__right__roomName__menu' src={menu} alt='' />
		</div>
	</ChannelContextMenu>
}

function getChannelRoute(route: string | null, rData: RoomData | null) {

	if (route === null || route === 'home')
		return (<ChatHome/>)
	else if (route === 'room/home' && rData)
		return (<ChatChannelHome rData={rData}/>)
	else if (route === 'room/settings' && rData)
		return (<ChatChannelParameter rData={rData}/>)
	else if (route === 'room/join')
		return (<ChatChannelJoin />)
	else if (route === 'privateMessage' && rData)
		return (<ChatPrivateMessage />)
	return (<ChatHome/>)
}
		

/* pages */
function ChatHome() {

	return (
		<div className='Chat__right__room'>
		<FriendList />
		</div>
	)
}

function ChatPrivateMessage() {
	const {content: {id}} = useContext(UserContext) as UserContextValue
	const {content: {rData}} = useContext(ChatContext) as ChatValue
	const [user, setUser] = useState<User | null>(null)

	useEffect(()=>{
		if (!rData)
			return
		if (rData.users[0].user.id === id)
			setUser(rData.users[1].user)
		else
			setUser(rData.users[0].user)
	}, [rData, setUser, id])

	return (
		user &&
		<>
			<div className='Chat__right__roomName'>
				<div className='Chat__right__roomName__image'>
					<img src={`${BACKEND_HOSTNAME}/${user.avatar}`} alt=''/>
				</div> 
				{user.name}
			</div>
			<div className='Chat__right__room'>

				<ChatUi priv={true}/>
			</div>
		</>
	)
}

function ChatChannelHome({rData}: {rData: RoomData}) {

	return (
		<>
			<ChannelHeader rData={rData}/>
			<div className='Chat__right__room'>
			<ChatUi />
			<RoomUsers/>
			</div>
		</>
	)
}

function ChatChannelParameter({rData}: {rData: RoomData}) {
	return (
		<>
			<ChannelHeader rData={rData}/>
			<div className='Chat__right__room'>
			<ChannelParameter />
			</div>
		</>
	)
}

function ChatChannelJoin() {
	return (
		<div className='Chat__right__room'>
		<ChannelJoin />
		</div>
	)
}
