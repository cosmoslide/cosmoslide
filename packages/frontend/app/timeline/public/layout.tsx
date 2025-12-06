import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Public Timeline - Cosmoslide',
  description: 'See what everyone is sharing on Cosmoslide',
  openGraph: {
    title: 'Public Timeline - Cosmoslide',
    description: 'See what everyone is sharing on Cosmoslide',
  },
};

export default function PublicTimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
