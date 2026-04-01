export default function Sun({ onClick }) {
  return (
    <div
      className="absolute top-0 right-8 w-14 h-14 rounded-full bg-[#FFD700] shadow-[0_0_40px_15px_rgba(255,215,0,0.4)] cursor-pointer z-10"
      onClick={onClick}
    />
  );
}
