import { Github } from "lucide-react";

import { REPO_URL } from "@/lib/site";

type TGitHubLinkProps = {
    label: string;
    className?: string;
};

// Small icon button linking to the source repository.
export const GitHubLink = (props: TGitHubLinkProps) => {
    const { label, className = '' } = props;

    return (
        <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            aria-label={label}
            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors
                hover:bg-[var(--bg-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${className}`}
        >
            <Github className="w-4 h-4" strokeWidth={1.75} />
        </a>
    );
};
