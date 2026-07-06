import { Check } from "lucide-react"

interface ProofChecklistRowProps {
  label: string
  value?: string
}

export const ProofChecklistRow = ({ label, value }: ProofChecklistRowProps) => (
  <div className="flex items-start gap-[5px]">
    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success-icon">
      <Check className="h-2.5 w-2.5 text-white" aria-hidden="true" />
    </span>
    <p className="text-sm text-slate-1200">
      {label}
      {value && (
        <>
          {" "}
          <strong className="font-bold">{value}</strong>
        </>
      )}
    </p>
  </div>
)
