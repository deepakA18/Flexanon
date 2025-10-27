"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, Clock, Coins } from "lucide-react"
import { motion } from "framer-motion"

interface PlanData {
    plan: string
    status: string
    updates_used: number
    updates_remaining: number
    updates_limit: number
    links_used: number
    links_remaining: number
    links_limit: number
    expires_at: string
}

export default function PlanStatusCard({ data }: { data: PlanData }) {
    const { plan, status, updates_used, updates_limit, expires_at, updates_remaining } = data

    const usagePercent = Math.round((updates_used / updates_limit) * 100)
    const expiresDate = new Date(expires_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.97 }}
                        className="cursor-pointer"
                    >
                        <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white px-4 py-2.5 rounded-xl flex items-center gap-3 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                            <Badge
                                variant="secondary"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500/30 font-semibold capitalize shadow-md hover:from-blue-500 hover:to-blue-600 transition-all duration-300"
                            >
                                {plan}
                            </Badge>
                            <div className="flex items-center gap-1.5 bg-slate-800/40 px-3 py-1 rounded-lg border border-slate-700/30">
                                <span className="text-sm text-white font-bold">
                                    {updates_remaining}
                                </span>
                                <span className="text-sm text-slate-500">/</span>
                                <span className="text-sm text-slate-400 font-medium">
                                    {updates_limit}
                                </span>
                                <Coins className="h-4 w-4 text-yellow-400 ml-1 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]" />
                            </div>
                        </div>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent
                    side="bottom"
                    className="bg-zinc-900/95 backdrop-blur-sm border border-emerald-500/20 text-white p-4 rounded-lg shadow-xl"
                >
                    <div className="flex flex-col space-y-2.5">
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-sm text-muted-foreground">Plan</span>
                            <span className="font-semibold capitalize text-emerald-400">{plan}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <span className="font-medium text-emerald-400">{status}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-sm text-muted-foreground">Updates</span>
                            <span className="font-medium">{updates_used}/{updates_limit}</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent my-1" />
                        <div className="flex items-center justify-between gap-8">
                            <span className="text-sm text-muted-foreground">Expires</span>
                            <span className="font-medium text-zinc-300">{expiresDate}</span>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
