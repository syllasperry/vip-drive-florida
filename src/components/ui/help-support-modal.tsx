import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface HelpSupportModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  // Handle ESC key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md mx-auto max-h-[80vh] overflow-hidden flex flex-col"
        aria-modal="true"
        role="dialog"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-4 text-sm leading-relaxed">
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface HelpContentProps {
  content: string
}

export const HelpContent: React.FC<HelpContentProps> = ({ content }) => {
  const formatContent = (text: string) => {
    return text.split('\n').map((line, index) => {
      const trimmedLine = line.trim()
      
      if (!trimmedLine) {
        return <br key={index} />
      }
      
      // Handle bold text with **
      if (trimmedLine.includes('**')) {
        const parts = trimmedLine.split('**')
        return (
          <p key={index} className="mb-2">
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <strong key={partIndex}>{part}</strong>
              ) : (
                <span key={partIndex}>{part}</span>
              )
            )}
          </p>
        )
      }
      
      // Handle email links
      if (trimmedLine.includes('support@vipchauffeur.com')) {
        return (
          <p key={index} className="mb-2">
            📧 <strong>Email:</strong>{' '}
            <a 
              href="mailto:support@vipchauffeur.com" 
              className="text-blue-600 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                window.open('mailto:support@vipchauffeur.com?subject=VIP Chauffeur Support Request')
              }}
            >
              support@vipchauffeur.com
            </a>{' '}
            (tap to open mail client)
          </p>
        )
      }
      
      // Handle phone links
      if (trimmedLine.includes('+1 (555) 123-4567')) {
        return (
          <p key={index} className="mb-2">
            📞 <strong>Phone:</strong>{' '}
            <a 
              href="tel:+15551234567" 
              className="text-blue-600 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = 'tel:+15551234567'
              }}
            >
              +1 (555) 123-4567
            </a>{' '}
            (tap to call)
          </p>
        )
      }
      
      // Handle SMS text
      if (trimmedLine.includes('💬 **Text Message:**')) {
        return (
          <p key={index} className="mb-2">
            💬 <strong>Text Message:</strong>{' '}
            <a 
              href="sms:+15551234567" 
              className="text-blue-600 hover:underline"
              onClick={(e) => {
                e.preventDefault()
                window.location.href = 'sms:+15551234567?body=Hi, I need help with my VIP Chauffeur booking.'
              }}
            >
              Tap to open SMS composer
            </a>
          </p>
        )
      }
      
      // Regular paragraphs
      return (
        <p key={index} className="mb-2">
          {trimmedLine}
        </p>
      )
    })
  }

  return <>{formatContent(content)}</>
}