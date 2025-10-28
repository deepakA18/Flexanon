"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, Clock, Coins, Crown, Calendar } from "lucide-react"
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
    const expiresDate = new Date(expires_at).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })

    const isActive = status.toLowerCase() === 'active'

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="cursor-pointer"
                    >
                        <div className="bg-white  p-2 shadow-xs rounded-xl flex items-center gap-3 hover:border-blue-400 hover:shadow-lg transition-all duration-300">
                            <Badge
                                variant="secondary"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none font-semibold capitalize px-3 py-1 shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                            >
                                <Crown className="h-3.5 w-3.5 mr-1.5" />
                                {plan}
                            </Badge>
                            
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-base font-bold text-gray-900">
                                        {updates_remaining}
                                    </span>
                                    <span className="text-xs text-gray-400">/</span>
                                    <span className="text-sm text-gray-600 font-medium">
                                        {updates_limit}
                                    </span>
                                </div>
                                <Coins className="h-4 w-4 text-yellow-500" />
                            </div>

                            {isActive && (
                                <div className="ml-auto">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                            )}
                        </div>
                    </motion.div>
                </TooltipTrigger>
                <TooltipContent
                    side="bottom"
                    className="bg-white border-2 border-gray-200 text-gray-900 p-0 rounded-xl shadow-xl max-w-xs"
                    sideOffset={8}
                >
                    <div className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Crown className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-gray-900">Subscription Plan</h4>
                                <p className="text-xs text-gray-500">Current usage and limits</p>
                            </div>
                        </div>

                        {/* Plan Info */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Plan Type</span>
                                <Badge 
                                    variant="secondary" 
                                    className="bg-blue-100 text-blue-700 border-none font-semibold capitalize text-xs"
                                >
                                    {plan}
                                </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-600">Status</span>
                                <div className="flex items-center gap-1.5">
                                    <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                                    <span className={`text-xs font-semibold capitalize ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                                        {status}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-gray-200 my-2" />

                            {/* Usage Stats */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-600">Updates Used</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {updates_used} / {updates_limit}
                                    </span>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <Progress 
                                        value={usagePercent} 
                                        className="h-2 bg-gray-200"
                                    />
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">{usagePercent}% used</span>
                                        <span className="font-semibold text-blue-600">
                                            {updates_remaining} remaining
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-200 my-2" />

                            {/* Expiry Date */}
                            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-600" />
                                    <span className="text-xs font-medium text-gray-600">Expires on</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-900">{expiresDate}</span>
                            </div>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}