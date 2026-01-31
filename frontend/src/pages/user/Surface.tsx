const Surface = ({ title, children }: any) => {
  return (
    <div className="bg-white/[0.035] rounded-3xl p-6 border border-white/10">
      <h2 className="text-lg font-medium mb-6">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

export default Surface;
