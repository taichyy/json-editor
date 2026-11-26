// JSON Owl mark: owl holding a code page. Same artwork as app/icon.svg.

type TOwlLogoProps = {
    size?: number;
    className?: string;
};

type TBrandProps = {
    size?: number;
    className?: string;
    hideNameOnMobile?: boolean;
};

export const OwlLogo = (props: TOwlLogoProps) => {
    const { size = 24, className } = props;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
            className={className}
        >
            <path
                fill="var(--owl-body)"
                d="M6.2 2.8 11 6.2a14 14 0 0 1 10 0l4.8-3.4.1 6.6a10.6 10.6 0 0 1 2.1 6.3c0 6-5.4 10.3-12 10.3S4 21.7 4 15.7c0-2.3.7-4.5 2.1-6.3Z"
            />
            <path fill="var(--owl-paper)" d="M11.4 8.4a5 5 0 0 1 4.6 3 5 5 0 1 1 4.6 7L16 20.6l-4.6-2.2a5 5 0 0 1 0-10Z" />
            <circle cx="11.4" cy="13.4" r="2.3" fill="var(--owl-pupil)" />
            <circle cx="20.6" cy="13.4" r="2.3" fill="var(--owl-pupil)" />
            <path fill="var(--owl-beak)" d="m16 15.4 1.6 1.7-1.6 1.9-1.6-1.9Z" />
            <path
                fill="var(--owl-paper)"
                stroke="var(--owl-body)"
                strokeWidth="1.8"
                strokeLinejoin="round"
                d="M6.4 18.6h16.4l4 4v5.2a2.4 2.4 0 0 1-2.4 2.4H6.4A2.4 2.4 0 0 1 4 27.8V21a2.4 2.4 0 0 1 2.4-2.4Z"
            />
            <path fill="var(--owl-fold)" d="M22.8 19.5v3.1h3.1Z" />
            <path
                stroke="var(--owl-pupil)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12.6 22.2-2.4 2.3 2.4 2.3M18.2 22.2l2.4 2.3-2.4 2.3"
            />
        </svg>
    );
};

// Logo + "JSON Owl" wordmark, used in headers and footers.
export const Brand = (props: TBrandProps) => {
    const { size = 22, className = '', hideNameOnMobile = false } = props;

    return (
        <span className={`inline-flex items-center gap-2 select-none ${className}`}>
            <OwlLogo size={size} />
            <span
                className={`text-sm font-semibold tracking-tight ${hideNameOnMobile ? 'hidden sm:inline' : ''}`}
                style={{ color: "var(--text-primary)" }}
            >
                JSON <span style={{ color: "var(--accent-text)" }}>Owl</span>
            </span>
        </span>
    );
};
