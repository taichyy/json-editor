"use client"

import { useEffect, useState } from "react";

// True when the viewport matches the query; false during SSR / first paint.
export const useMediaQuery = (query: string): boolean => {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(query);
        const update = () => setMatches(mql.matches);
        update();
        mql.addEventListener("change", update);
        return () => mql.removeEventListener("change", update);
    }, [query]);

    return matches;
};

export const MOBILE_QUERY = "(max-width: 767px)";
