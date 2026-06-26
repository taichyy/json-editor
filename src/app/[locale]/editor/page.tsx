'use client';

import JsonEditor from '@/components/JsonEditor';
import { useRouter } from '@/i18n/navigation';

export default function EditorPage() {
  const router = useRouter();

  return <JsonEditor onBackToHome={() => router.push('/')} />;
}
