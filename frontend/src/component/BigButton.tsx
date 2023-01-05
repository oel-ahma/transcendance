import React from 'react'

export default function BigButton({ name, onClick } : { name: string, onClick?: any }) {
  return (
    onClick ?
    <div className={'BigButton'} onClick={onClick}>{name}</div>
    :
    <div className={'BigButton'}>{name}</div>
  )
}
