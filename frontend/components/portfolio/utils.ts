export const formatCurrency = (value?: number) => {
  return value?.toLocaleString?.('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'
}

export const isPnlPositive = (pnlPercentage?: number) => {
  return (pnlPercentage ?? 0) >= 0
}

export const truncateAddress = (address?: string) => {
  if (!address) return ''
  return `${address?.slice?.(0, 8)}...${address?.slice?.(-8)}`
}
