import { useContext, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import _, { forEach } from 'lodash'
import InvisibleInput, { InvisibleInputSelect } from "../../component/InvisibleInput"
import ImageUploader from "../../component/ImageUploader"
import Listing from "../../component/Listing"
import SaveBox, { ErrorBox } from "../../component/SaveBox"
import cross from '../../images/cross.svg'
import Modal from "../../component/Modal"
import { ChatContext } from "../../context/chatContext/chatContext"
import { ChatValue, RoomUser } from "../../context/chatContext/chatContextTypes"
import { CreateServerModal } from "./AllChannel"
import { UserContext, UserContextValue } from "../../context/userContext"
import binSvg from '../../images/bin.svg'
import { protectedFetch } from "../../lib/fetchImprove"

type ServerProtection = 'Private' | 'Protected' | 'Public'

interface RoomOpt {
	image: any | string,
	name: string,
	serverProtection: string,
	pass: string,
	admin: RoomUser[],
	muted: RoomUser[],
	banned: RoomUser[]
}

function SaveProtection({modal, setModal, onQuit, onSave}
: {modal: boolean, setModal: (a: boolean)=>void, onQuit: ()=>void, onSave: ()=>void}) {

	return (
		<Modal open={modal} setOpen={setModal}>
			<div className='ModalBox' style={{overflow:'unset'}}>
				<div className='ModalBox__title'>Are you sure to quit without saving?</div>
				<div className='ModalBox__bottomBox ModalBox__bottomBox' onClick={onSave}>Keep editing</div>
				<div className='ModalBox__bottomBox ModalBox__bottomBox--b' onClick={onQuit}>Leave</div>
			</div>
		</Modal>
	)
}

export function ChannelParameter() {

	const [global, setGlobal] = useState<RoomOpt>({
		image: 'https://pierreevl.vercel.app/image/logo.jpg',
		name: '',
		serverProtection: '',
		pass: '',
		admin: [],
		muted: [],
		banned: []
	})
	const [bin, setBin] = useState<RoomUser[]>([])
	const [local, setLocal] = useState<RoomOpt>({image: '', name: '',serverProtection: '',pass: '',admin: [],muted: [],banned: []})
	const [modified, setModified] = useState<boolean>(false)
	const {setLocation, content: {rData}, deleteChannel, updateChannel, resetGrade} = useContext(ChatContext) as ChatValue
	const {content: cUser, token, deleteToken} = useContext(UserContext) as UserContextValue
	const [loading, setLoading] = useState(true)

	useEffect(() => {

		if (!rData)
			return
		global.name = rData.name
		global.serverProtection = rData.type[0].toUpperCase() + rData.type.substring(1).toLowerCase()
		global.admin = rData.users.filter((user: RoomUser)=> user.state === 'ADMIN' && user.user.id !== cUser.id)
		global.muted = rData.users.filter((user: RoomUser)=> user.state === 'MUTE')
		global.banned = rData.users.filter((user: RoomUser)=> user.state === 'BAN')
		setGlobal({...global})
		setLoading(false)
	},
	[rData])

	useEffect(() => {
		setLocal({...global})
	},
	[global])

	const [modal, setModal] = useState<boolean>(false)

	function close() {
		if (modified)
			setModal(true)
		else
			goHome()
	}

	function goHome() {
		if (!rData)
			return
		setLocation('room/home', rData.id)
	}

	/*update local */
	function setImage(image: any) {
		local.image = image
		setLocal({...local})
	}
	function resetImage() {
		local.image = global.image
		setLocal({...local})
	}
	function setServerProtection(value: string) {
		local.serverProtection = value
		setLocal({...local})
	}
	function setAdmin(admins: RoomUser[]) {
		local.admin = admins
		setLocal({...local})
	}
	function setMuted(muteds: RoomUser[]) {
		local.muted = muteds
		setLocal({...local})
	}
	function setBanned(banneds: RoomUser[]) {
		local.banned = banneds
		setLocal({...local})
	}
	function setRoomName(name: string) {
		local.name = name
		setLocal({...local})
	}
	function setRoomPass(pass: string) {
		local.pass = pass
		setLocal({...local})
	}
	/*update local */

	function reset() {
		setLocal(Object.assign({}, global))
		setBin([])
	}

	useEffect(() => {

		if (_.isEqual(local, global) === false)
			setModified(true)
		else
			setModified(false)

	}, [local, global])

	/* delete channel + modal */
	const [deleteModal, setDeleteModal] = useState<boolean>(false)
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string[] | null>(null)
	const [deleteError, setDeleteError] = useState<string | null>(null)

	useEffect(()=>{
		if (deleteModal === false)
			setDeleteError(null)		
	}, [deleteModal, setDeleteError])

	function eventDeleteChannel() {
		if (!rData)
			return
		setIsLoading(true)
		deleteChannel(rData.id, (statusCode: number, statusText: string)=>{
			setIsLoading(false)
			if (statusCode !== 200)
				setDeleteError(statusText)
			else {
				setDeleteModal(false)
			}
		})
	}
	function openDeleteModal() {
		setDeleteModal(true)
	}
	/* delete channel */

	function save() {
		if (!rData)
			return
		setLoading(true);
		setError(null);
		protectedFetch({
			token, deleteToken,
			method: 'PUT',
			url: `/channels/${rData.id}`,
			body: {
				name: local.name,
				type: local.serverProtection.toUpperCase(),
				password: local.pass
			},
			onSuccess: async (res: Response)=>{
				setLoading(false);
				if (res.ok)
				{
					binToUser()
					updateChannel(local.name, rData.id)
					setGlobal({...local})
				}
				else {
					const data = await res.json();
					setError(data.message);
				}
			}
		})
	}

	function binToUser() {
		bin.forEach((user: RoomUser)=>{
			resetGrade(user.user.id)
		})
		setBin([])
	}

	return (
		<div className='ChannelParameter--container'>
			<SaveProtection modal={modal} setModal={setModal} onSave={()=>{setModal(false)}} onQuit={goHome}/>
			<div className='ChannelParameter'>
				{loading ? <p>loading...</p> :
				<>
					<img onClick={close} src={cross} className='ChannelParameter__cross' alt='' />
					<div className='ChannelParameter__image'>
						<img
						alt="not fount"
						src={typeof(local.image) === 'string' ? local.image
						: URL.createObjectURL(local.image)}
						onError={resetImage}
						/>
					</div>
					<InvisibleInput name={'Room name'} value={local.name} setValue={setRoomName}/>
					<InvisibleInputSelect name={'Server protection'} choices={[
						'Private',
						'Protected',
						'Public'
					]} setSelected={setServerProtection} selected={local.serverProtection}/>
					<InvisibleInput name={'Pass for room'} isLock={local.serverProtection !== 'Protected'}
					value={local.pass} setValue={setRoomPass}/>
					<Listing name={'Admins'} data={local.admin} setData={setAdmin} setBin={setBin} bin={bin}/>
					<Listing name={'Muted'} data={local.muted} setData={setMuted} setBin={setBin} bin={bin}/>
					<Listing name={'Banned'} data={local.banned} setData={setBanned} setBin={setBin} bin={bin}/>

					<div onClick={openDeleteModal} className='ChannelParameter__deleteChannel'>
						DELETE CHANNEL
						<img src={binSvg} alt=''/>
					</div>
					<CreateServerModal modal={deleteModal} setModal={setDeleteModal}
					isLoading={isLoading} error={deleteError}
					onCreate={eventDeleteChannel} message={`Do you really want to delete "${rData?.name}"?`}
					title={'Delete room'} />

					{modified && <SaveBox onReset={reset} onSave={save}/>}
					{error && <ErrorBox content={error} />}
				</>
				}
			</div>
		</div>
	)
}