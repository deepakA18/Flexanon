'use client'

import React from 'react'
import { TrendingUp, TrendingDown, List } from 'lucide-react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Position {
  symbol: string
  name: string
  icon_url?: string
  quantity: string
  price: number
  value: number
  changes?: {
    percent_1d?: number
  }
}

interface TopAssetsListProps {
  positions?: Position[]
}

export default function TopAssetsList({ positions = [] }: TopAssetsListProps) {
  return (
    <Card className='bg-white text-primary'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 ">
          <List className="w-4 h-4" />
          <span className="text-sm font-semibold">Top Assets</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-8  text-sm">
            No assets found
          </div>
        ) : (
          <div className="overflow-x-auto text-primary">
            <Table>
              <TableHeader>
                <TableRow className='text-primary'>
                  <TableHead className="text-left text-primary">Asset</TableHead>
                  <TableHead className="text-right text-primary">Amount</TableHead>
                  <TableHead className="text-right text-primary">Price</TableHead>
                  <TableHead className="text-right text-primary">Value</TableHead>
                  <TableHead className="text-right text-primary">24h</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position, index) => {
                  const change = position.changes?.percent_1d || 0
                  const isPositive = change >= 0
              
                  return (
                    <TableRow key={position.symbol + index}>
                      {/* Asset */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {position.icon_url && (
                            <Image 
                              height={32}
                              width={32}
                              src={position.icon_url} 
                              alt={position.symbol}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-semibold  text-sm">{position.symbol}</div>
                            <div className="text-xs ">{position.name}</div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-right">
                        <span className="text-sm font-medium ">
                          {parseFloat(position.quantity).toFixed(4)}
                        </span>
                      </TableCell>

                      {/* Price */}
                      <TableCell className="text-right">
                        <span className="text-sm font-medium ">
                          ${position.price.toFixed(2)}
                        </span>
                      </TableCell>

                      {/* Value */}
                      <TableCell className="text-right">
                        <span className="text-sm font-bold ">
                          ${position.value.toFixed(2)}
                        </span>
                      </TableCell>

                      {/* 24h Change */}
                      <TableCell className="text-right">
                        <Badge 
                          variant="secondary"
                          className={`inline-flex items-center gap-1
                            ${isPositive ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                        >
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="text-xs font-semibold">
                            {isPositive ? '+' : ''}{(change).toFixed(2)}%
                          </span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}