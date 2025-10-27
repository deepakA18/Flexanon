'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function PortfolioEmpty() {
  return (
    <Card className="portfolio-card relative overflow-hidden rounded-2xl shadow-lg">
      <div className="portfolio-bevel" />
      <div className="portfolio-inner-shadow" />

      <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center gap-3">
        <p className="text-neutral-400">Unable to load portfolio</p>
      </CardContent>
    </Card>
  )
}
