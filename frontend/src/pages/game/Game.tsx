import React, {useEffect, useRef, useState} from 'react';
import {
    AnyEventObject,
    BaseActionObject,
    ResolveTypegenMeta,
    ServiceMap,
    State,
    TypegenDisabled,
} from 'xstate';
import {BACKEND_HOSTNAME} from '../../envir';
import { player } from './gameplay';
import {HiddedModal} from '../../component/Modal';
import { NameWithMenu } from '../../component/ProfilBox';

function GameModal({
    gameId,
    gameRef,
    open,
    setOpen,
    current,
}: {
    gameId: string;
    gameRef: any;
    open: boolean;
    setOpen: (dir: boolean) => void;
    current: State<
        unknown,
        AnyEventObject,
        any,
        {
            value: any;
            context: unknown;
        },
        ResolveTypegenMeta<
            TypegenDisabled,
            AnyEventObject,
            BaseActionObject,
            ServiceMap
        >
    >;
}) {
    return (
        <HiddedModal open={open} setOpen={(dir: boolean) => {}}>
            <div className="bigArena" onClick={() => setOpen(false)}>
                <div className="innerArena">
                    <GameArena
                        gameId={gameId}
                        gameRef={gameRef}
                        current={current}
                    />
                </div>
            </div>
        </HiddedModal>
    );
}

function GameArena({
    gameId,
    gameRef,
    onClick,
    current,
}: {
    gameId: string;
    gameRef: any;
    onClick?: () => void;
    current: any;
}) {
    function eventClick(e: any) {
        e.preventDefault();
        if (onClick) onClick();
    }

    return (
        <div className="gameArena--container" onClick={eventClick}>
            <div ref={gameRef} className="gameArena" tabIndex={1}>
                <svg
                    className={gameId}
                    width={'100%'}
                    height={'100%'}
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        x={0}
                        y={0}
                        width={'100%'}
                        height={'100%'}
                        fill="white"
                        strokeWidth="5"
                    />
                    <line
                        x1={'50%'}
                        x2={'50%'}
                        y1={0}
                        y2={'100%'}
                        stroke="black"
                        strokeWidth="1%"
                        strokeDasharray={`3.2% 1.2%`}
                    />
                </svg>
            </div>
            
            <div className="gameArena__players">
                <div className="gameArena__players__profile">
                    <span className="gameArena__players__profile__name">
                        <NameWithMenu user={current.context.player} color={'white'}/>
                    </span>
                    <div className="gameArena__players__profile__image">
                        <img
                            alt=""
                            src={`${BACKEND_HOSTNAME}/${current.context.player.avatar}`}
                        />
                    </div>
                </div>
                <div className="gameArena__players__profile">
                    <div className="gameArena__players__profile__image">
                        <img
                            alt=""
                            src={`${BACKEND_HOSTNAME}/${current.context.opponent.avatar}`}
                        />
                    </div>
                    <span className="gameArena__players__profile__name">
                        <NameWithMenu user={current.context.opponent} color={'white'}/>
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function Game({current, send}: {current: any, send: any}) {
	const gameRef = useRef<any>(null)
	const gameRef2 = useRef<any>(null)
	const [bigScreen, setBigScreen] = useState<boolean>(false)
	
	var gameId: string = "gameid0";

	
	useEffect(() => {
		var cleanupFunc = player([
			{ref: gameRef.current, mobileControl: false},
			{ref: gameRef2.current, mobileControl: true}
		], current)
        return (()=>{
            if (cleanupFunc) cleanupFunc()
        })
        
	}, [gameRef, gameRef2, current])

	function openGame() {
		setBigScreen(true)
	}
	
	/* player */
	return (
		<>
			<div className='Game'>
				{current.matches('connected.spectateRoom') &&
				<div style={{display:'flex', flexDirection: 'column'}}>
					<div>You are a spectator</div>
					<button onClick={()=>send('LEAVE')}>Leave</button>
				</div>
				}
				<div>
				{process.env.REACT_APP_URL}/?roomId={current.context.gameState.id}
				</div>
			</div>
			<GameArena gameId={gameId} gameRef={gameRef} onClick={openGame} current={current}/>
			<GameModal gameId={gameId} gameRef={gameRef2} open={bigScreen}
			setOpen={setBigScreen} current={current}/>
		</>
	)
}

