'use client'

import React from 'react'
import { Loader2, Wallet, TrendingUp, PieChart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function PortfolioLoading() {
  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 gap-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-12 h-12 text-blue-500" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Wallet className="w-6 h-6 text-blue-600" />
            </motion.div>
          </div>
          
          <div className="text-center space-y-2">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-gray-800"
            >
              Loading Your Portfolio
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-600"
            >
              Fetching your assets and performance data...
            </motion.p>
          </div>
        </motion.div>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {[
            { span: 4, icon: TrendingUp },
            { span: 3, icon: PieChart },
            { span: 2, icon: Wallet },
            { span: 3, icon: TrendingUp }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`md:col-span-${item.span}`}
            >
              <Card className="bg-white border-2 border-blue-200 shadow-lg p-6 h-32">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Large Chart Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-8"
          >
            <Card className="bg-white border-2 border-blue-200 shadow-lg p-6 h-64">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="flex items-end justify-between h-40 gap-2">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.random() * 100}%` }}
                    transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                    className="flex-1 bg-blue-200 rounded-t"
                  />
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-4"
          >
            <Card className="bg-white border-2 border-blue-200 shadow-lg p-6 h-64 flex items-center justify-center">
              <div className="relative w-40 h-40">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-8 border-gray-200 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border-8 border-blue-200 border-t-blue-500 rounded-full"
                />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Loading Progress Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-2 py-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}