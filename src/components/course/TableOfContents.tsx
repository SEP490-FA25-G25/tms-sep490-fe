import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface TableOfContentsProps {
  sections: Array<{
    id: string
    label: string
    icon: LucideIcon
  }>
  activeSection: string
  onSectionChange: (sectionId: string) => void
}

export function TableOfContents({ sections, activeSection, onSectionChange }: TableOfContentsProps) {
  const handleSectionClick = (sectionId: string) => {
    // Update active section
    onSectionChange(sectionId)

    // Smooth scroll to section
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      // Update URL hash without page reload
      const newUrl = `${window.location.pathname}#${sectionId}`
      window.history.replaceState(null, '', newUrl)
    }
  }

  return (
    <nav className="space-y-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div>
          <h3 className="font-semibold text-gray-900 mb-6">Nội dung</h3>
        </div>

        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id

            return (
              <Button
                key={section.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left h-auto py-3 px-4 rounded-md',
                  'hover:bg-gray-100 hover:text-gray-900 transition-colors',
                  isActive && 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                )}
                onClick={() => handleSectionClick(section.id)}
              >
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="text-sm font-medium">{section.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h4 className="font-medium text-sm text-gray-900 mb-4">Tiến độ</h4>
        <div className="space-y-2">
          {sections.map((section, index) => {
            const sectionIndex = sections.findIndex(s => s.id === activeSection)
            const isCompleted = index < sectionIndex
            const isCurrent = index === sectionIndex

            return (
              <div key={section.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    isCompleted && 'bg-green-500',
                    isCurrent && 'bg-blue-500',
                    !isCompleted && !isCurrent && 'bg-gray-300'
                  )}
                />
                <span
                  className={cn(
                    'text-xs truncate',
                    isCompleted && 'text-green-700',
                    isCurrent && 'text-blue-700 font-medium',
                    !isCompleted && !isCurrent && 'text-gray-500'
                  )}
                >
                  {section.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </nav>
  )
}