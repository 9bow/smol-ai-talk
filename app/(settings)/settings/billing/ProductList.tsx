import {
  getActiveProductsWithPrices,
  getSession,
  getSubscription,
  getUserDetails
} from '@/app/supabase-server'
import { redirect } from 'next/navigation'

import ProductDetail from './ProductDetail'

export default async function ProductList() {
  const [session, userDetails, products, subscription] = await Promise.all([
    getSession(),
    getUserDetails(),
    getActiveProductsWithPrices(),
    getSubscription()
  ])

  const user = session?.user

  if (!session) {
    return redirect('/signin')
  }

  // const subscriptionPrice =
  //   subscription &&
  //   new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: subscription?.prices?.currency!,
  //     minimumFractionDigits: 0
  //   }).format((subscription?.prices?.unit_amount || 0) / 100)

  return (
    <>
      {products.map(product => (
        <ProductDetail
          key={product.id}
          session={session}
          product={product}
          subscription={subscription}
        />
      ))}
    </>
  )
}
