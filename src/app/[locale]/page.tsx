'use client';

import { useState } from 'react';

import JsonEditor from '@/components/JsonEditor';
import { LandingPage } from '@/components/LandingPage';

export default function Home() {
    const [inEditor, setInEditor] = useState(false);

    if (inEditor) {
        return <JsonEditor onBackToHome={() => setInEditor(false)} />;
    }

    return <LandingPage onEnter={() => setInEditor(true)} />;
}
