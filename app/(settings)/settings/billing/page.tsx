import { Separator } from '../../../../components/ui/separator'

import ProductList from '@/app/(settings)/settings/billing/ProductList'
import { Suspense } from 'react'

export default async function Account() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Billing</h3>
        <p className="text-sm text-muted-foreground">
          Manage billing settings, view invoices and pause your subscription.
        </p>
      </div>
      <Separator />
      <Suspense>
        <ProductList />
      </Suspense>
    </div>
  )
}
