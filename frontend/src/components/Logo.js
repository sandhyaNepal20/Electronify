import React from 'react'
import logoImage from '../assest/banner/logo.png'

const Logo = ({ w, h }) => {
    return (
        <img
            src={logoImage}
            alt="Logo"
            width={w}
            height={h}
            className="object-contain"
        />
    )
}

export default Logo