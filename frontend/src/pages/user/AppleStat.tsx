const AppleStat = ({ title, value }: { title: string; value: any }) => {
  return (
    <div className="bg-white/[0.04] rounded-2xl px-6 py-5 border border-white/10">
      <p className="text-sm text-white/50">{title}</p>
      <p className="text-3xl font-semibold mt-2">{value}</p>
    </div>
  );
};

export default AppleStat;
