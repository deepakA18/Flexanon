'use client'

import React from 'react'
import { Loader2, Wallet, TrendingUp, PieChart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

export default function PortfolioLoading() {
  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Animated Header with Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-12 gap-4"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-16 h-16 rounded-full border-4 border-[#004aad]/20 border-t-[#004aad]" />
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Wallet className="w-8 h-8 text-[#004aad]" />
            </motion.div>
          </div>
          
          <div className="text-center space-y-2">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-gray-900"
            >
              Loading Your Portfolio
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-gray-500"
            >
              Fetching your assets and performance data...
            </motion.p>
          </div>
        </motion.div>

        {/* Main Unified Card Skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-3xl overflow-hidden shadow-2xl">
            
            {/* Left Side - Blue Section Skeleton */}
            <div className="lg:col-span-8 bg-[#004aad] text-white p-8">
              
              {/* Header Skeleton */}
              <div className="flex items-start justify-between mb-8">
                <div className="space-y-6 flex-1">
                  <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                  
                  <div className="space-y-3">
                    <div className="h-16 w-64 bg-white/30 rounded-lg animate-pulse" />
                    <div className="h-8 w-24 bg-white/20 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex items-center gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 bg-white/10 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              </div>

              {/* Metrics Row Skeleton */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="h-4 w-24 bg-white/20 rounded animate-pulse" />
                    <div className="h-8 w-32 bg-white/30 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-white/15 rounded animate-pulse" />
                  </motion.div>
                ))}
              </div>

              {/* Period Selector Skeleton */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {['1h', '8h', '1d', '1w', '1m', '6m', '1y'].map((period, i) => (
                  <motion.div
                    key={period}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.05 }}
                    className="h-10 w-12 bg-white/10 rounded-lg animate-pulse"
                  />
                ))}
              </div>

              {/* Chart Skeleton */}
              <div className="h-[400px] relative">
                {/* Background bars */}
                <div className="absolute inset-0 opacity-20">
                  <div className="flex items-end justify-between h-full px-2 gap-1">
                    {Array.from({ length: 80 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.random() * 100}%` }}
                        transition={{ 
                          delay: 0.7 + i * 0.01,
                          duration: 0.3,
                          repeat: Infinity,
                          repeatType: "reverse",
                          repeatDelay: 1
                        }}
                        className="flex-1 bg-white/40 rounded-t-sm"
                        style={{ minHeight: '10%' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Animated line placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-white/60 text-center"
                  >
                    <TrendingUp className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm">Loading chart data...</p>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Right Side - Dark Panel Skeleton */}
            <div className="lg:col-span-4 bg-[#1a1a1a] text-white p-6">
              
              {/* Risk Score Skeleton */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-8"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-7 w-32 bg-white/10 rounded animate-pulse" />
                    <div className="h-7 w-28 bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>

                <div className="mb-2">
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: ['0%', '60%', '40%', '60%'] }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="h-full bg-gradient-to-r from-green-500 via-orange-400 to-red-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-8 bg-white/10 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                </div>
              </motion.div>

              {/* Top Assets Header Skeleton */}
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-28 bg-white/10 rounded animate-pulse" />
                <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
              </div>

              {/* Top Assets Grid Skeleton */}
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                    className={`rounded-xl p-3 bg-[#252525] h-fit ${
                      i === 3 ? 'col-span-2' : ''
                    }`}
                  >
                    {/* Asset Icon & Name */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                      <div className="space-y-1 flex-1">
                        <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
                        <div className="h-2 w-20 bg-white/10 rounded animate-pulse" />
                      </div>
                    </div>

                    {/* Asset Values */}
                    <div className="space-y-1">
                      <div className="h-5 w-16 bg-white/10 rounded animate-pulse" />
                      <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
                      <div className="h-3 w-14 bg-white/10 rounded animate-pulse" />
                    </div>

                    {/* Mini chart for large card */}
                    {i === 3 && (
                      <div className="mt-3 h-16">
                        <div className="flex items-end justify-between h-full gap-[2px]">
                          {Array.from({ length: 40 }).map((_, j) => (
                            <motion.div
                              key={j}
                              initial={{ height: '20%' }}
                              animate={{ height: `${Math.random() * 100}%` }}
                              transition={{
                                delay: 1.2 + j * 0.02,
                                duration: 0.3,
                                repeat: Infinity,
                                repeatType: "reverse",
                                repeatDelay: 1
                              }}
                              className="flex-1 bg-white/20 rounded-t-sm"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Loading Progress Dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-2 py-8"
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
              className="w-2 h-2 bg-[#004aad] rounded-full"
            />
          ))}
        </motion.div>

        {/* Loading Status Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <motion.p
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-sm text-gray-500"
          >
            Please wait while we load your portfolio data...
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}