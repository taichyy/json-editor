'use client';

import { LandingPage } from '@/components/LandingPage';
import { useRouter } from '@/i18n/navigation';

export default function Home() {
  const router = useRouter();

  return <LandingPage onEnter={() => router.push('/editor')} />;
}
