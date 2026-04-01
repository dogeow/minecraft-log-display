import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function sliceLinks(links) {
    const total = links.length;
    if (total <= 7) return links;

    const first = links[0];
    const prev = links[1];
    const next = links[total - 2];
    const last = links[total - 1];
    const currentIdx = links.findIndex((l) => l.active);

    const nearby = [];
    for (let i = Math.max(2, currentIdx - 1); i <= Math.min(currentIdx + 1, total - 3); i++) {
        nearby.push(links[i]);
    }

    if (currentIdx <= 3) {
        nearby.length = 0;
        for (let i = 2; i <= Math.min(5, total - 3); i++) {
            nearby.push(links[i]);
        }
    }
    if (currentIdx >= total - 5) {
        nearby.length = 0;
        for (let i = Math.max(total - 6, 2); i <= total - 3; i++) {
            nearby.push(links[i]);
        }
    }

    return [first, prev, ...nearby, next, last];
}

export default function Pagination({ items, searchParams }) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(max-width: 768px)");
        setIsMobile(mq.matches);
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    const buildUrl = (page) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page);
        return `?${params.toString()}`;
    };

    const visibleLinks = isMobile ? sliceLinks(items.links) : items.links;

    return (
        <div className="mt-4 overflow-x-auto">
            <div className="flex justify-center gap-1 min-w-max">
                {visibleLinks.map((link, i) => (
                    <Link
                        key={i}
                        to={buildUrl(link.page)}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                        className={`px-2 py-1 text-xs rounded ${
                            link.active
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground hover:bg-muted"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}
