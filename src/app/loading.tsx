export default function Loading() {
  return (
    <div className="min-h-screen bg-[#ece0cc] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#234d1b]/20 border-t-[#234d1b] rounded-full animate-spin" />
        <p className="text-[10px] font-sans font-black text-[#234d1b] uppercase tracking-widest">
          Loading...
        </p>
      </div>
    </div>
  );
}
