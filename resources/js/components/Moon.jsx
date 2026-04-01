export default function Moon({ onClick }) {
  return (
    <div
      className="absolute top-0 right-8 w-12 h-12 rounded-full bg-[#F4F1C9] shadow-[0_0_30px_10px_rgba(244,241,201,0.3)] cursor-pointer z-10"
      onClick={onClick}
    >
      <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-[#D4D1A0] opacity-60" />
      <div className="absolute top-4 left-2 w-2 h-2 rounded-full bg-[#D4D1A0] opacity-50" />
    </div>
  );
}
