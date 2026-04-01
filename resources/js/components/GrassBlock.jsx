export default function GrassBlock() {
    return (
        <div
            className="fixed start-0 end-0 bottom-0 h-12 z-[100]"
            style={{
                backgroundImage:
                    "url('/images/minecraft_grass_block_texture.jpg')",
                backgroundSize: "auto 3rem",
                backgroundRepeat: "repeat-x",
            }}
        />
    );
}
