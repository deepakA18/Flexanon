"use client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

interface StatusMessageProps {
  status: { message: string; type: "info" | "success" | "error" } | null
}

export default function StatusMessage({ status }: StatusMessageProps) {
  if (!status) return null

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <Alert
        variant={status.type === "error" ? "destructive" : "default"}
        className={`border-0 ${
          status.type === "success"
            ? "bg-green-50 text-green-900"
            : status.type === "error"
              ? "bg-red-50 text-red-900"
              : "bg-blue-50 text-blue-900"
        }`}
      >
        <div className="flex items-center gap-2">
          {status.type === "success" && <CheckCircle2 className="w-4 h-4" />}
          {status.type === "error" && <AlertCircle className="w-4 h-4" />}
          {status.type === "info" && <Loader2 className="w-4 h-4 animate-spin" />}
          <AlertDescription>{status.message}</AlertDescription>
        </div>
      </Alert>
    </motion.div>
  )
}
