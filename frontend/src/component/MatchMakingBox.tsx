import React, { useEffect, useState } from "react";
import Modal, { useModal } from "./Modal";
import ModalBox from "./ModalBox";

export function Timer() {
	const [inter, setInter] = useState<NodeJS.Timer | null>(null)
	const [time, setTime] = useState<number>(0)

	useEffect(() => {
		setInter(setInterval(()=>{
			setTime(queueTime => queueTime += 1)
		}, 1000))

		return (()=>{
			if (inter)
				clearInterval(inter)
		})
	}, [])
	
	return (
		<span>{time}</span>
	)
}

export default function MatchMakingButton({open, setOpen}:
{open: boolean, setOpen: (dir: boolean)=>void}) {

	function close() {
		setOpen(false)
	}
	function randomColor() {
		return '#' + Math.floor(Math.random()*16777215).toString(16);
	}
	return (
		<Modal open={open} setOpen={setOpen}>
			<div className='ModalBox' style={{overflow:'unset'}}>
				<div className='ModalBox__title'>Waiting for opponent</div>
				<div className='MatchMakingBox'>
					<div className='MatchMakingBox__time'><Timer />s</div>
					<div className='MatchMakingBox__waiter' style={{backgroundColor: randomColor()}}/>
					<div className='MatchMakingBox__waiter' style={{animationDelay: '200ms', backgroundColor: randomColor()}}/>
					<div className='MatchMakingBox__waiter' style={{animationDelay: '400ms', backgroundColor: randomColor()}}/>
					<div className='MatchMakingBox__waiter' style={{animationDelay: '600ms', backgroundColor: randomColor()}}/>
					<div className='MatchMakingBox__waiter' style={{animationDelay: '800ms', backgroundColor: randomColor()}}/>
				</div>
				<div className='ModalBox__bottomBox ModalBox__bottomBox--b' onClick={close}>Cancel</div>
			</div>
		</Modal>
	)
}