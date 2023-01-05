import { useContext } from 'react'
import BigButton from '../component/BigButton'
import MatchMakingButton from '../component/MatchMakingBox'
import Modal from '../component/Modal'
import { NameWithMenu } from '../component/ProfilBox'
import { GameContext } from '../context/gameContext'
import { UserContext, UserContextValue } from '../context/userContext'
import Game from './game/Game'

function GameOverModal({open, setOpen, gameState}:
{open: boolean, setOpen: (dir: boolean)=>void, gameState: any}) {
	const { content: user } = useContext(UserContext) as UserContextValue

	var victory: number
	if (gameState.players.left.connected.id === user.id) {
		if (gameState.players.left.points > gameState.players.right.points)
			victory = 1
		else
			victory = 2
	} else if (gameState.players.right.connected.id === user.id) {
		if (gameState.players.left.points > gameState.players.right.points)
			victory = 2
		else
			victory = 1
	} else {
		victory = 3
	}

	var bgColor: string
	if (victory === 1) bgColor = 'rgb(89, 150, 89)'
	else if (victory === 2) bgColor = 'rgb(150, 89, 89)'
	else bgColor = 'black'

	return (
		<Modal open={open} setOpen={setOpen}>
			<div className='ModalBox' style={{overflow:'unset'}}>
				<div className='ModalBox__title'>Game over!</div>
				<div className='GameOverModal' style={{backgroundColor: bgColor}}>
					<div className='GameOverModal__player'>
						<NameWithMenu user={gameState.players.left.connected} color={'white'}/>{`: ${gameState.players.left.points}`}
					</div>
					<div className='GameOverModal__player'>
						<NameWithMenu user={gameState.players.right.connected} color={'white'}/>{`: ${gameState.players.right.points}`}
					</div>
					{victory !== 3 &&
					<div className='GameOverModal__win'>
						{victory === 1 ? 'Victory!' : 'Defeat!'}
					</div>
					}
				</div>
				<div className='ModalBox__bottomBox ModalBox__bottomBox--b' onClick={()=>setOpen(false)}>Ok!</div>
			</div>
		</Modal>
	)
}

export function PauseModal({open, setOpen, message}:
	{open: boolean, setOpen: (dir: boolean)=>void, message: string}) {
	
		return (
			<Modal open={open} setOpen={setOpen}>
				<div className='ModalBox' style={{overflow:'unset'}}>
					<div className='ModalBox__title'>{message}</div>
					<div className='MatchMakingBox'>
						<div className='MatchMakingBox__waiter' style={{backgroundColor: 'green'}}/>
					</div>
				</div>
			</Modal>
		)
}

export default function Home() {
	const { current, send } = useContext(GameContext) as any

	function setOpen(dir: boolean) {
		send({ type: 'CANCEL' })
	}
	function okEvent() {
		send({ type: 'OK' })
	}
	function startNormal(e: React.MouseEvent) {
		e.stopPropagation()
		send({ type: 'PLAY', gameMode: 'NORMAL' })
	}
	function startSpecial(e: React.MouseEvent) {
		e.stopPropagation()
		send({ type: 'PLAY', gameMode: 'SPECIAL' })
	}
	function startNotNormal(e: React.MouseEvent) {
		e.stopPropagation()
		send({ type: 'PLAY', gameMode: 'NOT_NORMAL' })
	}
	return (
		<div className={'home'}>
			{current.matches('connected.end_game') && <GameOverModal open={current.matches('connected.end_game')}
			setOpen={okEvent} gameState={current.context.gameState}/>}

			<PauseModal open={current.matches('connected.room.pause')} setOpen={()=>{}} message={'Opponent is disconnected'}/>
			<PauseModal open={current.matches('connected.reconnect')} setOpen={()=>{}} message={'Reconnection'}/>
			<PauseModal open={current.matches('connected.trouble_connection')} setOpen={()=>{}} message={'Connection issue'}/>
			<PauseModal open={current.matches('fetch')} setOpen={()=>{}} message={'Connection...'}/>
			{current.matches('fetch') ?
			<p style={{color: 'white', textAlign: 'center'}}>Loading...</p>
			: current.matches('error') ?
			<p style={{color: 'white', textAlign: 'center'}}>error...</p>
			: current.matches('connected.room') | current.matches('connected.spectateRoom.look') ?
			<div className={'home__game'} style={{flexDirection: 'column'}}>
				<Game current={current} send={send}/>
	   		</div>
			:
			<>
				<MatchMakingButton open={current.matches('connected.matchmaking')} setOpen={setOpen} />
				<BigButton name={'NORMAL GAME'} onClick={startNormal}/>
				<BigButton name={'SPECIAL GAME'} onClick={startSpecial}/>
				<BigButton name={'NOT NORMAL GAME'} onClick={startNotNormal}/>
			</>
			}
		</div>
	)
}