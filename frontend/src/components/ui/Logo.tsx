const Logo = ({
  size = "md",
  textClassName = "text-white",
  markClassName = "",
  containerClassName = "",
}: {
  size?: "sm" | "md" | "lg"
  textClassName?: string
  markClassName?: string
  containerClassName?: string
}) => {
  const sizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  }

  return (
    <div className={`flex items-center gap-2 select-none ${containerClassName}`}>
      <div
        className={`
        w-9 h-9 rounded-xl
        bg-gradient-to-br from-emerald-400 to-teal-400
        flex items-center justify-center
        shadow-lg
        ${markClassName}
      `}
      >
        <span className="text-black font-bold">⚡</span>
      </div>

      <span
        className={`
          ${sizes[size]}
          font-semibold tracking-wide
          ${textClassName}
        `}
      >
        Evora
      </span>
    </div>
  )
}

export default Logo
