// Helper functions for Firebase Realtime Database operations
import { getFirebaseServer } from './firebase'

export async function getAllProducts(filters?: {
  categoryId?: string
  isActive?: boolean
  search?: string
  locationId?: string
}): Promise<any[]> {
  const { db } = getFirebaseServer()
  
  try {
    // Get all products
    let products = await db.getAll('products')
    
    // Apply filters
    if (filters?.isActive === true) {
      products = products.filter((p: any) => p.isActive === true)
    }
    if (filters?.categoryId) {
      products = products.filter((p: any) => p.categoryId === filters.categoryId)
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      products = products.filter((p: any) => 
        (p.nameAr && p.nameAr.toLowerCase().includes(searchLower)) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(searchLower))
      )
    }
    
    if (products.length === 0) {
      return []
    }
    
    const productIds = products.map((p: any) => p.id)
    const categoryIds = [...new Set(products.map((p: any) => p.categoryId).filter(Boolean))]
    
    // Get related data in parallel
    const [variants, images, categories, sizes, colors, stockItems] = await Promise.all([
      db.getAll('product_variants').then(v => v.filter((v: any) => productIds.includes(v.productId))),
      db.getAll('product_images').then(i => i.filter((i: any) => productIds.includes(i.productId))),
      categoryIds.length > 0 ? db.getAll('categories').then(c => c.filter((c: any) => categoryIds.includes(c.id))) : Promise.resolve([]),
      db.getAll('sizes'),
      db.getAll('colors'),
      filters?.locationId ? db.getAll('stock_items').then(s => s.filter((s: any) => s.locationId === filters.locationId)) : Promise.resolve([]),
    ])
    
    // Create maps for quick lookup
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]))
    const sizeMap = new Map(sizes.map((s: any) => [s.id, s]))
    const colorMap = new Map(colors.map((c: any) => [c.id, c]))
    const stockMap = new Map(stockItems.map((s: any) => [s.variantId, s.quantity]))
    
    // Combine data
    return products.map((product: any) => ({
      ...product,
      category: categoryMap.get(product.categoryId) || null,
      variants: variants
        .filter((v: any) => v.productId === product.id)
        .map((v: any) => ({
          ...v,
          size: sizeMap.get(v.sizeId) || null,
          color: colorMap.get(v.colorId) || null,
          stockQuantity: stockMap.get(v.id) || 0,
        })),
      images: images.filter((img: any) => img.productId === product.id),
    }))
  } catch (error) {
    console.error('Error getting all products:', error)
    return []
  }
}

export async function getProductById(productId: string): Promise<any | null> {
  const { db } = getFirebaseServer()
  
  try {
    const product = await db.get(`products/${productId}`)
    if (!product) return null
    
    // Get related data
    const [variants, images, category, sizes, colors] = await Promise.all([
      db.getAll('product_variants').then(v => v.filter((v: any) => v.productId === productId)),
      db.getAll('product_images').then(i => i.filter((i: any) => i.productId === productId).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))),
      product.categoryId ? db.get(`categories/${product.categoryId}`) : Promise.resolve(null),
      db.getAll('sizes'),
      db.getAll('colors'),
    ])
    
    const sizeMap = new Map(sizes.map((s: any) => [s.id, s]))
    const colorMap = new Map(colors.map((c: any) => [c.id, c]))
    
    return {
      ...product,
      id: productId,
      category: category ? { id: product.categoryId, ...category } : null,
      variants: variants.map((v: any) => ({
        ...v,
        size: sizeMap.get(v.sizeId) || null,
        color: colorMap.get(v.colorId) || null,
      })),
      images: images,
    }
  } catch (error) {
    console.error('Error getting product by ID:', error)
    return null
  }
}

export function generateId(): string {
  // Generate a simple ID (Firebase push generates better IDs, but this works for manual IDs)
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}


