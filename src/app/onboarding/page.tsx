import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRouteForUser } from '@/utils/role-routes'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Check, MapPin, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BranchOnboardingPage() {
  const navigate = useNavigate()
  const { user, branches, selectBranch, selectedBranchId, needsBranchOnboarding, isLoading } = useAuth()
  const [selected, setSelected] = useState<number | null>(selectedBranchId)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // Wait for auth to be ready
    if (isLoading) {
      return
    }

    // Not logged in
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    // User already selected a branch
    if (!needsBranchOnboarding) {
      const defaultRoute = getDefaultRouteForUser(user.roles)
      navigate(defaultRoute, { replace: true })
      return
    }

    // Single branch - auto select
    if (branches.length === 1) {
      selectBranch(branches[0].id)
      const defaultRoute = getDefaultRouteForUser(user.roles)
      navigate(defaultRoute, { replace: true })
      return
    }

    // No branches
    if (branches.length === 0) {
      const defaultRoute = getDefaultRouteForUser(user.roles)
      navigate(defaultRoute, { replace: true })
      return
    }

    // Multi-branch user needs to select
    setShouldRender(true)
  }, [isLoading, user, branches, needsBranchOnboarding, selectBranch, navigate])

  // Show loading while checking auth state
  if (isLoading || !shouldRender) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    )
  }

  const handleSelect = (branchId: number) => {
    setSelected(branchId)
  }

  const handleContinue = () => {
    if (selected) {
      selectBranch(selected)
      if (user?.roles) {
        const defaultRoute = getDefaultRouteForUser(user.roles)
        navigate(defaultRoute, { replace: true })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Chọn chi nhánh làm việc
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Xin chào, <span className="font-medium text-foreground">{user?.fullName}</span>! 
              Bạn được phân công tại nhiều chi nhánh. Vui lòng chọn chi nhánh bạn muốn làm việc hôm nay.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelect(branch.id)}
                  className={cn(
                    "relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    selected === branch.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border"
                  )}
                >
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                    selected === branch.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {branch.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Mã chi nhánh: {branch.id}
                    </p>
                  </div>
                  {selected === branch.id && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Button
                size="lg"
                onClick={handleContinue}
                disabled={!selected}
                className="w-full"
              >
                Tiếp tục
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Bạn có thể đổi chi nhánh bất cứ lúc nào từ menu tài khoản
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
