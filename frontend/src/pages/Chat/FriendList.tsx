import { useContext } from "react"
import { NameWithMenu } from "../../component/ProfilBox"
import { ChatContext } from "../../context/chatContext/chatContext"
import { ChatValue } from "../../context/chatContext/chatContextTypes"
import { Friend, FriendsContext, FriendsContextValue } from "../../context/friendsContext"
import { BACKEND_HOSTNAME } from "../../envir"
import unblock from '../../images/unblock.svg'
import bin from '../../images/bin.svg'
import addFriendSvg from '../../images/friendAdd.svg'
import send from '../../images/send.svg'


export function FriendColorStatus({children, friend}: {children: React.ReactElement, friend: Friend}) {

	return (
		friend.state === 'ACCEPTED' ?
		<div className={`FriendStatus--${friend.status}`}>
			{children}
		</div>
		:
		<>
			{children}
		</>
	)
}

function FriendListFriend({friend, friend: {user}, state}: {friend: Friend, state: 'WAITING' | 'SEND_WAITING' | 'ACCEPTED' | 'BLOCKED'}) {

	const {chatLink, openPrivateMessage} = useContext(ChatContext) as ChatValue
	const {acceptFriend, removeLink} = useContext(FriendsContext) as FriendsContextValue

	var menu = (()=>{
		var link = friend.state
		if (link === 'WAITING') 
			return (
				<div>
					<img className='FriendList__friend__event' src={addFriendSvg} alt='' onClick={acceptFriendEvent}/>
					<img className='FriendList__friend__event' src={bin} alt='' onClick={removeLinkEvent}/>
				</div>
			)
		if (link === 'SEND_WAITING')
			return (<img className='FriendList__friend__event' src={bin} alt='' onClick={removeLinkEvent}/>)
		if (link === 'BLOCKED')
			return (<img className='FriendList__friend__event' src={unblock} alt='' onClick={removeLinkEvent}/>)
		return (
			<img className='FriendList__friend__event' src={send} alt=''
			onClick={openPrivateMessageEvent}/>
		)
	})()

	function acceptFriendEvent() {
		acceptFriend(user.id)
	}
	function removeLinkEvent() {
		removeLink(user.id)
	}
	function openPrivateMessageEvent() {
		openPrivateMessage(user.id)
	}

	return (
		<div className='FriendList__friend'>
			<div className='FriendList__friend__profile'>
				<FriendColorStatus friend={friend}>
					<img src={`${BACKEND_HOSTNAME}/${user.avatar}`} alt='' className='FriendList__friend__profile__image' />
				</FriendColorStatus>
			
				<NameWithMenu user={user} link={chatLink} />
			</div>
			{menu}
		</div>
	)
}

export function FriendList() {
	const {state: {friends} } = useContext(FriendsContext) as FriendsContextValue

	return (
		<div className='FriendList--container'>
			<div className='FriendList'>
				<h1>Friend list</h1>
				<p>Friends: </p>
				{friends.map((friend: Friend, index: number)=>{
					if (friend.state === 'ACCEPTED')
						return <FriendListFriend key={index} friend={friend} state={'ACCEPTED'}/>
					return null
				})}
				<p>Request received: </p>
				{friends.map((friend: Friend, index: number)=>{
					if (friend.state === 'WAITING')
						return <FriendListFriend key={index} friend={friend} state={'WAITING'}/>
					return null
				})}
				<p>Request sended: </p>
				{friends.map((friend: Friend, index: number)=>{
					if (friend.state === 'SEND_WAITING')
						return <FriendListFriend key={index} friend={friend} state={'SEND_WAITING'}/>
					return null
				})}
				<p>Blocked: </p>
				{friends.map((friend: Friend, index: number)=>{
					if (friend.state === 'BLOCKED')
						return <FriendListFriend key={index} friend={friend} state={'BLOCKED'}/>
					return null
				})}
			</div>
		</div>
	)
}