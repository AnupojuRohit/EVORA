import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, Upload, X, Check, Loader2, User } from "lucide-react"

interface AvatarUploaderProps {
  currentImage?: string | null
  onImageChange: (imageUrl: string | null) => void
  size?: "sm" | "md" | "lg"
  userName?: string
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
}

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
}

export const AvatarUploader = ({
  currentImage,
  onImageChange,
  size = "lg",
  userName = "User",
}: AvatarUploaderProps) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync with external changes
  useEffect(() => {
    setPreviewUrl(currentImage || null)
  }, [currentImage])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      setError("Please select a JPG or PNG image")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreviewUrl(result)
        
        // Simulate upload delay for UX
        setTimeout(() => {
          setIsUploading(false)
          setShowSuccess(true)
          onImageChange(result)
          
          // Store in localStorage for persistence
          localStorage.setItem("evora_avatar", result)
          
          // Hide success after 2 seconds
          setTimeout(() => setShowSuccess(false), 2000)
        }, 800)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError("Failed to upload image")
      setIsUploading(false)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageChange(null)
    localStorage.removeItem("evora_avatar")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="relative inline-block">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
        id="avatar-upload"
      />

      <motion.div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden cursor-pointer group`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => fileInputRef.current?.click()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar Image or Placeholder */}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center border-2 border-dashed border-white/20">
            {userName ? (
              <span className="text-white font-semibold text-lg">
                {getInitials(userName)}
              </span>
            ) : (
              <User className={`${iconSizes[size]} text-white/50`} />
            )}
          </div>
        )}

        {/* Hover Overlay */}
        <AnimatePresence>
          {(isHovering || isUploading) && !showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              {isUploading ? (
                <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
              ) : (
                <div className="text-center">
                  <Camera className={`${iconSizes[size]} text-white mx-auto`} />
                  <span className="text-xs text-white/80 mt-1 block">
                    {previewUrl ? "Change" : "Upload"}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center"
            >
              <Check className={`${iconSizes[size]} text-white`} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Border Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 group-hover:border-emerald-400/60 transition-colors" />
      </motion.div>

      {/* Remove Button */}
      {previewUrl && !isUploading && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => {
            e.stopPropagation()
            handleRemoveImage()
          }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-colors shadow-lg"
        >
          <X className="w-3 h-3" />
        </motion.button>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -bottom-6 left-0 right-0 text-center text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AvatarUploader
