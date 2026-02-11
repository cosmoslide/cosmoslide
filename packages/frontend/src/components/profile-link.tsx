import { useNavigate } from '@tanstack/react-router';
import { type ReactNode } from 'react';

interface ProfileLinkProps {
  username: string;
  domain?: string;
  children: ReactNode;
  className?: string;
}

export default function ProfileLink({
  username,
  domain,
  children,
  className,
}: ProfileLinkProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Build the route - for federated users include domain
    const route = domain ? `/@${username}@${domain}` : `/@${username}`;
    navigate({ to: route });
  };

  const displayHandle = domain ? `@${username}@${domain}` : `@${username}`;

  return (
    <a href={displayHandle} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
