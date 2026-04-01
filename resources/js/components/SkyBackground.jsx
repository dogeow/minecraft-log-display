export default function SkyBackground({ isDark }) {
    if (isDark) return null;

    return (
        <div
            className="fixed inset-0 -z-10"
            style={{
                background:
                    "linear-gradient(to bottom, #87CEEB 0%, #FFFFFF 100%)",
            }}
        />
    );
}
