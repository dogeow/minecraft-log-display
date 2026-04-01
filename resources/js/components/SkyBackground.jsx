export default function SkyBackground({ isDark }) {
    if (isDark) return null;

    return (
        <div
            className="fixed start-0 end-0 top-[60px] bottom-0 -z-10"
            style={{
                background:
                    "linear-gradient(to bottom, #87CEEB 0%, #FFFFFF 100%)",
            }}
        />
    );
}
