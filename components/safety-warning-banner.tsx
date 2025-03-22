import Image from "next/image"

export function SafetyWarningBanner() {
  return (
    <div className="bg-[#ff9c1314] p-4 mb-4 rounded-2xl w-fit">
      <div className="flex items-start">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-RPEDRQ4Vpqw7zUBPRQFbhYPHU1GTU2.png"
          alt="Info"
          width={24}
          height={24}
          className="mr-2 flex-shrink-0 mt-0.5"
        />
        <div>
          <span className="font-bold">Stay safe: </span>
          <span className="text-sm">
            Never share login details or verification codes. Check URLs and contact us only via live chat.
          </span>
        </div>
      </div>
    </div>
  )
}

