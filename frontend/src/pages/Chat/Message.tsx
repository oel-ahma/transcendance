import React, { useContext, useEffect, useRef, useState } from "react";
import ReactTextareaAutosize from "react-textarea-autosize";
import MatchMakingButton from "../../component/MatchMakingBox";
import { NameWithMenu } from "../../component/ProfilBox";
import { ChatValue, MessageType, User } from "../../context/chatContext/chatContextTypes";
import { ChatContext } from "../../context/chatContext/chatContext";
import { FriendsContext, FriendsContextValue, FriendStatus } from "../../context/friendsContext";
import { UserContext, UserContextValue } from "../../context/userContext";
import { useRoomProfilTools } from "../../context/userMenu";
import { BACKEND_HOSTNAME } from "../../envir";
import game from '../../images/game.svg'
import sendSvg from '../../images/send.svg'
import { GameContext } from "../../context/gameContext";
import { PauseModal } from "../Home";
import { Tool } from "../../context/rightClickMenu";

function Message({ content, user, direction='left', priv }:
{ content: string, user: User, direction?: string, priv: boolean }) {
	
	const {chatLink, getGradeColor} = useContext(ChatContext) as ChatValue
	const {getFriendLink} = useContext(FriendsContext) as FriendsContextValue
	const tools = useRoomProfilTools(user)

	var gradeColor = getGradeColor(user.id)
	var friendStatus = getFriendLink(user.id)
	if (direction === 'right')
	{
		return (
			<div className='Message Message__right'>
				<div className='Message__data'>
					<p className='Message__name Message__right__name'>
						{/* <span className='Message__date Message__right__date'>11:52</span> */}
						<NameWithMenu user={user} link={chatLink} tools={priv ? [] : tools} color={gradeColor}/>
					</p>
					<div className='Message__content Message__right__content'>{content}</div>
				</div>
			<img src={`${BACKEND_HOSTNAME}/${user.avatar}`} alt=''className='Message__image Message__right__image' />
			</div>
		)
	}
	return (
		<div className='Message'>
			<img src={`${BACKEND_HOSTNAME}/${user.avatar}`} alt='' className='Message__image Message__left__image' />
			<div className='Message__data'>
				<p className='Message__name'>
					<NameWithMenu user={user} link={chatLink} tools={priv ? [] : tools} color={gradeColor}/>
					{/* <span className='Message__date Message__left__date'>11:52</span> */}
				</p>
				{friendStatus === 'BLOCKED' ?
				<div className='Message__content Message__left__content Message__content--blocked'>
					This is user is blocked
				</div>
				:
				<div className='Message__content Message__left__content'>{content}</div>
			}
				
			</div>
		</div>
	)
}

// function MessageSystem({user, content}: {user: string, content: string}) {

// 	const {chatLink} = useContext(ChatContext) as ChatValue
// 	const tools = useRoomProfilTools(user)
// 	return (
// 		<div className='MessageSystem'>
// 			<NameWithMenu name={user} link={chatLink} tools={tools}/>
// 			<span style={{whiteSpace: 'pre'}}>{` ${content}`}</span>
// 		</div>
// 	)
// }

function MessageGame({message, priv}: {message: MessageType, priv: boolean}) {
	const {chatLink, getGradeColor} = useContext(ChatContext) as ChatValue
	const {send} = useContext(GameContext) as any
	const tools = useRoomProfilTools(message.User)
	var gradeColor = getGradeColor(message.User.id)

	function join() {
		send('PRIVATE_JOIN', {roomId: message.content, goToGame: goOnGame})
	}

	function goOnGame() {
		chatLink('/')
	}

	return (
		<div className='MessageGame'>
			<div className='MessageGame__content' style={{whiteSpace: 'pre'}}>
				<div  className='MessageGame__content__text'>
					<NameWithMenu user={message.User} link={chatLink} tools={priv ? [] : tools} color={gradeColor}/>
					{` want to play!`}
				</div>
				<button className='inlineButton' onClick={join}>Join</button>
			</div>
		</div>
	)
}

export default function ChatUi({priv = false}: {priv?: boolean}) {

	const ref = useRef<any>()
	const [value, setValue] = useState<string>('')
	const {content: {rData}, sendMessage, sendPrivateMessage,
	createPrivateGame ,getGradeUser, chatLink} = useContext(ChatContext) as ChatValue
	const {content: {id}} = useContext(UserContext) as UserContextValue
	const { current, send } = useContext(GameContext) as any
	const [gradeUser, setGradeUser] = useState('')

	useEffect(()=>{
		var grade = getGradeUser(id)
		if (grade)
		{
			if (grade === 'MUTE')
				setValue('You are muted')
			setGradeUser(grade)
		}
	}, [getGradeUser, id])
	
	function focus() {
		if(ref.current) ref.current.focus(); 
	}
	function onClickSendMessage(e: React.MouseEvent<HTMLDivElement>) {
		e.stopPropagation()
		sendMessageEvent()
	}
	function sendMessageEvent() {
		if (gradeUser === 'MUTE')
			return
		if (value.length === 0)
		{
			return
		}
		if (priv === true)
			sendPrivateMessage(value)
		else
			sendMessage(value)
		setValue('')
	}
	function enterSendMessage(e: React.KeyboardEvent<HTMLDivElement>) {
		e.stopPropagation()
		if (e.key === 'Enter')
		{		
			e.preventDefault()
			sendMessageEvent()
		}
	}
	function writeMsg(ev: any) {
		if (gradeUser === 'MUTE')
			setValue('You are muted')
		else
			setValue(ev.target.value)
	}
	function setOpen(dir: boolean) {
		if (dir === true) {
			send('PRIVATE_PLAY', {createPrivateGame: createPrivateGame(priv),
				goToGame: ()=>{chatLink('/')}})
		} else {
			send('CANCEL')
		}
	}

	return (
		<div className='ChatUi'>
			<div className='ChatUi__message'>
				<div className='ChatUi__message__container'>
					{rData && rData.messages.map((msg: MessageType, index: number)=>{
						if (msg.type === 'GAME')
							return <MessageGame message={msg} key={index} priv={priv}/>
						if (msg.User.id === id)
							return <Message direction={'right'} content={msg.content}
							user={msg.User} key={index} priv={priv}/>
						return <Message content={msg.content} user={msg.User} key={index} priv={priv}/>
					})
					}
				</div>
			</div>
			<div className={`ChatUi__input ${gradeUser === 'MUTE' && 'ChatUi__input--muted'}`}
			onClick={focus} onKeyDown={enterSendMessage}>
				<ReactTextareaAutosize
				ref={ref}
				onChange={writeMsg}
				value={value}
				tabIndex={gradeUser === 'MUTE' ? -1 : 0}
				/>
				<MatchMakingButton open={current.matches('connected.private_waiting')} setOpen={setOpen} />
				<img className='ChatUi__input__button' src={game} alt={'game'} onClick={()=>setOpen(true)}/>

				<PauseModal open={current.matches('connected.private_joining')}
					setOpen={()=>{}} message={'Trying to join the room'}/>
				<img className='ChatUi__input__button' src={sendSvg} alt={'send'} onClick={onClickSendMessage}/>
			</div>
		</div>
	)
}