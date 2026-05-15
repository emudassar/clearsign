export function buildLemonCheckoutUrl(variantId: string, userId?: string | null) {
  const store = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_SUBDOMAIN
  if (!store || !variantId) return null
  let url = `https://${store}.lemonsqueezy.com/checkout/buy/${variantId}`
  if (userId) {
    url += `?checkout[custom][user_id]=${encodeURIComponent(userId)}`
  }
  return url
}
