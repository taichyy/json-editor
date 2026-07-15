'use client';

import { useRouter } from '../../i18n/navigation';
import { LandingPage } from '../../components/landing-page';

const Home = () => {
  const router = useRouter();

  return <LandingPage onEnter={() => router.push('/editor')} />;
}

export default Home;