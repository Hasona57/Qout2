// Helper functions for Firebase Realtime Database operations (Store)
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
    const [variants, images, categories, sizes, colors, stockItems, locations] = await Promise.all([
      db.getAll('product_variants').then(v => v.filter((v: any) => productIds.includes(v.productId))),
      db.getAll('product_images').then(i => i.filter((i: any) => productIds.includes(i.productId))),
      categoryIds.length > 0 ? db.getAll('categories').then(c => c.filter((c: any) => categoryIds.includes(c.id))) : Promise.resolve([]),
      db.getAll('sizes'),
      db.getAll('colors'),
      db.getAll('stock_items'),
      db.getAll('stock_locations'),
    ])
    
    // Find store location
    const storeLocation = locations.find((l: any) => 
      l.name?.toLowerCase().includes('store') || 
      l.name?.toLowerCase().includes('متجر')
    )
    
    // Filter stock items
    let relevantStock = stockItems
    if (filters?.locationId) {
      relevantStock = stockItems.filter((s: any) => s.locationId === filters.locationId && (s.quantity || 0) > 0)
    } else if (storeLocation) {
      relevantStock = stockItems.filter((s: any) => s.locationId === storeLocation.id && (s.quantity || 0) > 0)
    } else {
      relevantStock = stockItems.filter((s: any) => (s.quantity || 0) > 0)
    }
    
    // Create stock map (sum quantities if multiple locations)
    const stockMap = new Map<string, number>()
    relevantStock.forEach((s: any) => {
      const current = stockMap.get(s.variantId) || 0
      stockMap.set(s.variantId, current + parseFloat(String(s.quantity || 0)))
    })
    
    // Create maps for quick lookup
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]))
    const sizeMap = new Map(sizes.map((s: any) => [s.id, s]))
    const colorMap = new Map(colors.map((c: any) => [c.id, c]))
    
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
    const [variants, images, category, sizes, colors, stockItems, locations] = await Promise.all([
      db.getAll('product_variants').then(v => v.filter((v: any) => v.productId === productId)),
      db.getAll('product_images').then(i => i.filter((i: any) => i.productId === productId).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))),
      product.categoryId ? db.get(`categories/${product.categoryId}`) : Promise.resolve(null),
      db.getAll('sizes'),
      db.getAll('colors'),
      db.getAll('stock_items'),
      db.getAll('stock_locations'),
    ])
    
    // Find store location
    const storeLocation = locations.find((l: any) => 
      l.name?.toLowerCase().includes('store') || 
      l.name?.toLowerCase().includes('متجر')
    )
    
    // Filter stock items
    let relevantStock = stockItems.filter((s: any) => (s.quantity || 0) > 0)
    if (storeLocation) {
      relevantStock = stockItems.filter((s: any) => s.locationId === storeLocation.id && (s.quantity || 0) > 0)
    }
    
    // Create stock map
    const stockMap = new Map<string, number>()
    relevantStock.forEach((s: any) => {
      if (variants.some((v: any) => v.id === s.variantId)) {
        const current = stockMap.get(s.variantId) || 0
        stockMap.set(s.variantId, current + parseFloat(String(s.quantity || 0)))
      }
    })
    
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
        stockQuantity: stockMap.get(v.id) || 0,
      })),
      images: images,
    }
  } catch (error) {
    console.error('Error getting product by ID:', error)
    return null
  }
}


