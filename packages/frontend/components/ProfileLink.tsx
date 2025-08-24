'use client'

import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

interface ProfileLinkProps {
  username: string
  children: ReactNode
  className?: string
}

export default function ProfileLink({ username, children, className }: ProfileLinkProps) {
  const router = useRouter()
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Navigate to the username route without @ in the actual path
    router.push(`/${username}`)
  }
  
  return (
    <a 
      href={`/@${username}`}
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  )
}