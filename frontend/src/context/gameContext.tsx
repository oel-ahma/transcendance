import { useMachine } from "@xstate/react"
import { createContext, useContext, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { gameMachine } from "../pages/game/gameMachine"
import { UserContext, UserContextValue } from "./userContext";


export const GameContext = createContext<any | null>(null);

export const GameContextProvider = ( {children}: { children: JSX.Element} ) => {
	const [current, send] = useMachine(gameMachine)
	const [searchParams] = useSearchParams()
	const { token, deleteToken, content: cUser } = useContext(UserContext) as UserContextValue

	useEffect(()=>{
		if (token && current && cUser.id !== 0)
			send({ type: 'FEED_TOKEN', token, deleteToken, playerId: cUser.id, searchParams })
	}, [token, current, deleteToken, send, cUser, searchParams])

	const value: {current:any, send: any} = {
        current,
		send
    }
    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    )
}