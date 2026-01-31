const StatCard = ({ icon: Icon, label, value }) => {
  return (
    <div className="ev-surface ev-glow ev-hover p-6 flex items-center gap-5">
      <div className="w-14 h-14 rounded-xl bg-emerald-500/15 flex items-center justify-center">
        <Icon className="w-7 h-7 text-emerald-400" />
      </div>

      <div>
        <p className="text-sm ev-sub">{label}</p>
        <p className="text-3xl font-semibold text-white leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
