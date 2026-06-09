'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export function EventsPageActions() {
  const { user } = useAuth();

  if (!user || (user.role !== 'ADMIN' && user.role !== 'CLUB')) {
    return null;
  }

  return (
    <Link href="/events/new" className="btn btn-primary">
      Create Event
    </Link>
  );
}
