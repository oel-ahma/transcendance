import { useContext, useEffect, useState } from "react"
import InvisibleInput from "../../component/InvisibleInput"
import { ChatContext } from "../../context/chatContext/chatContext"
import { ChatValue, RoomData, RoomPublicData } from "../../context/chatContext/chatContextTypes"
import { UserContext, UserContextValue } from "../../context/userContext"
import { protectedFetch } from "../../lib/fetchImprove"

export function ChannelJoin() {

	const {token, deleteToken} = useContext(UserContext) as UserContextValue
	const {content: {joinRoomId}, setLocation, addChannel} = useContext(ChatContext) as ChatValue

	const [roomPublicData, setRoomPublicData] = useState<null | RoomPublicData>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(false)

	useEffect(()=>{
		protectedFetch({
			token, deleteToken,
			url: `/channels/${joinRoomId}`,
			onSuccess: (res: Response)=>{
				if (res.status === 404) {
					setLocation('home')
				}
				if (res.status !== 200)
					return
				res.json().then((data: RoomPublicData)=>{
					setRoomPublicData(data)
					setLoading(false)
				})
			}
		})
	}, [])
	
	const [pass, setPass] = useState<string>('')

	function joinRoom() {
		setLoading(true)
		protectedFetch({
			token, deleteToken,
			url: `/channels/${joinRoomId}/join`,
			method: 'POST',
			onSuccess: (res: Response)=>{
				if (res.status !== 201)
				{
					setError(true)
					setLoading(false)
					return
				}
				res.json().then((data: RoomData)=>{
					setLoading(false)
					addChannel(data)
					setLocation('room/home', joinRoomId)
				})
			},
			body: {
				password: pass
			}
		})
	}

	return (
		<div className='JoinRoom'>
			<div className='JoinRoom--container'>
				{roomPublicData !== null ? <>
					<div className='JoinRoom__image'></div>
					<div className='JoinRoom__name'>{roomPublicData.name}</div>
					{roomPublicData.type === 'PRIVATE' ?
					<div className='JoinRoom__message'>Nothing to see here, this room is private</div>
					:
					<>
					{roomPublicData.type === 'PROTECTED' &&
					<InvisibleInput name={'Pass for room'} value={pass} setValue={setPass} error={error}/>
					}
					{loading ?
					<button className='smallButton'>Loading...</button>
					:
					<button className='smallButton' onClick={joinRoom}>Join Us</button>
					}
					</>
					}
				</>: <>loading...</>}
			</div>
		</div>
	)
}