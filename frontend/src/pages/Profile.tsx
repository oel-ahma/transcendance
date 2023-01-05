import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { NameWithMenu } from '../component/ProfilBox'
import PageError from './Page404'
import addFriendSvg from '../images/friendAdd.svg'
import settings from '../images/settings.svg'
import bin from '../images/bin.svg'
import block from '../images/block.svg'
import unblock from '../images/unblock.svg'
import removeFriend from '../images/removeFriend.svg'
import send from '../images/send.svg'
import { UserContext, UserContextValue } from '../context/userContext'
import { protectedFetch } from '../lib/fetchImprove'
import { ChatValue, User } from '../context/chatContext/chatContextTypes'
import { BACKEND_HOSTNAME } from '../envir'
import { FriendsContext, FriendsContextValue, FriendStatus } from '../context/friendsContext'
import { ChatContext } from '../context/chatContext/chatContext'

interface resumeGame {
	leftPlayer: User,
	rightPlayer: User,
	status: 'WIN' | 'LOSE',
	duration: number,
	pointsLeft: number,
	pointsRight: number,
}
export interface ProfileUser extends User {
	games: resumeGame[]
}

function HistoryGame({game, user}: {game: resumeGame, user: User} ) {

	return (
		<div className='History__game' style={
		((game.status === 'WIN' && game.leftPlayer.id === user.id)
		|| (game.status === 'LOSE' && game.leftPlayer.id !== user.id))
		?
			{backgroundColor: 'rgb(89, 150, 89)'} :
			{backgroundColor: 'rgb(150, 89, 89)'}
		}>
			<span className='History__game__sum'>
				<NameWithMenu user={game.leftPlayer}/>
				<span> {game.pointsLeft} | {game.pointsRight} </span> 
				<NameWithMenu user={game.rightPlayer}/>
			</span>
			<span className='History__game__time'>{game.duration}</span>
		</div>
	)
}

function History({games, user}: {games: resumeGame[], user: User}) {

	return (
		<div className='History'>
			{games.map((game, index) =>
				<HistoryGame key={index} game={game} user={user}/> 
			)}
		</div>
	)
}

function Winrate({games, user}: {games: resumeGame[], user: User}) {

	const [win, setWin] = useState(0)
	const [lose, setLose] = useState(0)
	
	useEffect(()=>{
		var w = 0
		var l = 0
		games.forEach((game: resumeGame)=>{
			if ((game.status === 'WIN' && game.leftPlayer.id === user.id)
			|| (game.status === 'LOSE' && game.leftPlayer.id !== user.id))
				w++
			else
				l++
		})
		setWin(w)
		setLose(l)
	}, [games, user])

	return (
		<div className='Winrate'>
			<span className='Winrate__score'>{win}wins {lose}loses</span>
			<div className='Winrate__win' style={{width: `${win / (win + lose) * 100}%`}}></div>
			<div className='Winrate__lose' style={{width: `${lose / (win + lose) * 100}%`}}></div>
		</div>
	)
}

export default function Profile() {

	var [searchParams] = useSearchParams()
	const { token, deleteToken, content: cUser } = useContext(UserContext) as UserContextValue
	const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading')
	const [user, setUser] = useState<ProfileUser>({name: '', avatar: '', id: 0, games: []})
	const {acceptFriend, removeLink, getFriendLink, addFriend, blockUser} = useContext(FriendsContext) as FriendsContextValue
	const {openPrivateMessage} = useContext(ChatContext) as ChatValue
	var link: FriendStatus | null = getFriendLink(user.id)

	var userId = searchParams.get("userId");

	useEffect(()=>{
		if (userId === null)
		{
			setState('invalid')
			return
		}
		protectedFetch({
			token, deleteToken,
			url: `/profile/${userId}`, method: 'GET',
			onSuccess: (data: Response)=>{
				if (data.status === 200) {
					data.json().then((data: ProfileUser)=>{
						setState('valid')
						setUser(data)
					}).catch()
				} else {
					setState('invalid')
				}
			}
		})
			
	}, [userId, token, deleteToken])

	/*menu */
	let navigate = useNavigate()
	function goSettings() {
		navigate(`/settings`)
	}
	function acceptFriendEvent() {
		acceptFriend(user.id)
	}
	function removeLinkEvent() {
		removeLink(user.id)
	}
	function addFriendEvent() {
		addFriend(user)
	}
	function blockUserEvent() {
		blockUser(user)
	}
	function sendpm() {
		openPrivateMessage(user.id)
	}
	/* menu */
	var menu = (()=>{
		if (cUser.id === user.id)
			return (<img src={settings} alt='' onClick={goSettings}/>)
		if (link === 'WAITING') 
			return (
				<>
					<img src={addFriendSvg} alt='' onClick={acceptFriendEvent}/>
					<img src={bin} alt='' onClick={removeLinkEvent}/>
				</>
			)
		if (link === 'SEND_WAITING') 
			return (<img src={bin} alt='' onClick={removeLinkEvent}/>)
		if (link === 'ACCEPTED') 
			return (
				<>
					<img src={send} alt='' onClick={sendpm}/>
					<img src={removeFriend} alt='' onClick={removeLinkEvent}/>
				</>
			)
		if (link === 'BLOCKED') 
			return (<img src={unblock} alt='' onClick={removeLinkEvent}/>)
		return (
			<>
				<img src={addFriendSvg} alt='' onClick={addFriendEvent}/>
				<img src={block} alt='' onClick={blockUserEvent}/>
			</>
		)

	})()

	if (state === 'loading')
	return (
		<PageError message={`Profile is loading`} />
	)
	else if (state === 'invalid')
	return (
		<PageError status={'400'} message={`Can't find this profile :(`} />
	)
	else if (link === 'BLOCKED_BY') {
		return (
			<PageError message={`This user blocked you o:`} />
		)
	}
	return (
		<>
			<div className='ProfilPage'>
				<div className='ProfilPage__image'>
					<img src={`${BACKEND_HOSTNAME}/${user.avatar}`} alt=''/>
				</div>
				<p className={'ProfilPage__name'}>
					<NameWithMenu user={user} />
				</p>
			</div>
			<div className='ProfilPage__menu'>
			{menu}
			</div>
			<Winrate games={user.games} user={user}/>
			<History games={user.games} user={user}/>
		</>
	)
}
