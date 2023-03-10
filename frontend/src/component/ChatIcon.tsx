import React, { useContext } from 'react'
import Send from '../images/whiteSend.svg'
import Home from '../images/whiteHome.svg';
import Profile from '../images/profile.svg';
import Settings from '../images/settingsWhite.svg';
import Logout from '../images/logout.svg';
import Chat from '../pages/Chat/Chat';
import { useNavigate } from 'react-router-dom'
import Modal from './Modal';
import { UserContext, UserContextValue } from '../context/userContext';
import { ChatContext } from '../context/chatContext/chatContext';
import { ChatValue } from '../context/chatContext/chatContextTypes';

export default function ChatIcon({ constraintsRef }:
{ constraintsRef: React.MutableRefObject<null> }) {

	return (
		<ChatIconWrapped constraintsRef={constraintsRef}/>
	)
}

function ChatIconWrapped({ constraintsRef } :
{ constraintsRef: React.MutableRefObject<null> }) {

    const {content: {id}, deleteToken} = useContext(UserContext) as UserContextValue
    const {content: {state: {open}}, setOpen} = useContext(ChatContext) as ChatValue

	function openChat() {
		setOpen(true)
	}
	let navigate = useNavigate()
	function goHome() {
		navigate(`/`)
	}
	function goProfile() {
		navigate(`/profile?userId=${id}`)
	}
	function goSettings() {
		navigate(`/settings`)
	}
	return (
		<div className='chatBox'>
			<img src={Send} alt='' onClick={openChat}/>
			<img src={Home} alt='' onClick={goHome}/>
			<img src={Profile} alt='' onClick={goProfile}/>
			<img src={Settings} alt='' onClick={goSettings}/>
			<img src={Logout} alt='' onClick={deleteToken}/>

			<Modal open={open} setOpen={setOpen}><Chat /></Modal>
		</div>
	)
}