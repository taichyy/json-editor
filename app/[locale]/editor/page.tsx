"use client";

import { useRouter } from "../../../i18n/navigation";
import JsonEditor from "../../../components/json-editor";

const EditorPage = () => {
    const router = useRouter();

    return <JsonEditor onBackToHome={() => router.push('/')} />;
};

export default EditorPage;
