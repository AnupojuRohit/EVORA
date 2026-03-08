const Row = ({ title, subtitle, right }: any) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-white/50">{subtitle}</p>
      </div>
      {right && <div className="text-sm text-white/70">{right}</div>}
    </div>
  );
};

export default Row;
