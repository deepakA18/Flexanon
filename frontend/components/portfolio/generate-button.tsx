import React from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface GenerateButtonProps {
  onClick: () => void
  loading: boolean
}

export const GenerateButton: React.FC<GenerateButtonProps> = ({ onClick, loading }) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={onClick}
        disabled={loading}
        size="lg"
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate Share Link'
        )}
      </Button>
    </motion.div>
  )
}