import Sun from "./Sun";
import Moon from "./Moon";
import Cloud from "./Cloud";

export default function SkyDecoration({ isDark, onToggle }) {
    const cloudContainer = (
        <>
            <Cloud className="absolute top-10 left-[15%] w-24 h-8 bg-white/20 rounded-full blur-[2px]" />
            <Cloud className="absolute top-16 left-[60%] w-20 h-6 bg-white/15 rounded-full blur-[2px]" />
            <Cloud className="absolute top-6 left-[40%] w-16 h-5 bg-white/10 rounded-full blur-[2px]" />
        </>
    );

    if (isDark) {
        return (
            <div className="relative mx-auto max-w-3xl h-24 mt-4">
                <Moon onClick={onToggle} />
                {cloudContainer}
            </div>
        );
    }

    return (
        <div className="relative mx-auto max-w-3xl h-24 mt-4">
            <Sun onClick={onToggle} />
            <Cloud className="absolute top-6 left-[5%] w-28 h-9 bg-white/90 rounded-full blur-[1px]" />
            <Cloud className="absolute top-14 left-[20%] w-24 h-7 bg-white/80 rounded-full blur-[1px]" />
            <Cloud className="absolute top-4 left-[35%] w-20 h-6 bg-white/85 rounded-full blur-[1px]" />
            <Cloud className="absolute top-16 left-[12%] w-16 h-5 bg-white/70 rounded-full blur-[1px]" />
        </div>
    );
}
