import { CreateClassWizard } from './components/CreateClassWizard'
import { DashboardLayout } from '@/components/DashboardLayout'

/**
 * Page: Create Class
 * Route: /academic/classes/create
 * Role: ACADEMIC_AFFAIR
 */
export default function CreateClassPage() {
  return (
    <DashboardLayout>
      <CreateClassWizard mode="create" />
    </DashboardLayout>
  )
}
