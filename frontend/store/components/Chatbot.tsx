'use client'

import React, { useState, useEffect, useRef } from 'react'
import { API_URL } from '../lib/auth'
import axios from 'axios'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationContext {
  lastProduct?: any
  lastIntent?: string
  mentionedProducts: any[]
}

// Advanced fuzzy matching with multiple algorithms
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1.0
  if (s1.includes(s2) || s2.includes(s1)) return 0.9
  
  // Jaccard similarity
  const words1 = new Set(s1.split(/\s+/))
  const words2 = new Set(s2.split(/\s+/))
  const intersection = new Set([...words1].filter(x => words2.has(x)))
  const union = new Set([...words1, ...words2])
  const jaccard = intersection.size / union.size
  
  // Levenshtein distance
  const levenshtein = levenshteinDistance(s1, s2)
  const maxLen = Math.max(s1.length, s2.length)
  const levenshteinSim = maxLen === 0 ? 1 : 1 - (levenshtein / maxLen)
  
  // Combined score
  return (jaccard * 0.4 + levenshteinSim * 0.6)
}

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

// Advanced intent extraction with context awareness
const extractIntent = (message: string, context?: ConversationContext): {
  intent: 'search' | 'price' | 'stock' | 'size' | 'color' | 'category' | 'help' | 'greeting' | 'comparison' | 'recommendation' | 'general'
  confidence: number
  keywords: string[]
  entities: { type: 'product' | 'size' | 'color' | 'price_range' | 'number', value: string }[]
} => {
  const lower = message.toLowerCase().trim()
  const words = lower.split(/\s+/).filter(w => w.length > 1)
  
  // Expanded intent patterns
  const intentPatterns = {
    greeting: {
      patterns: ['مرحبا', 'السلام', 'اهلا', 'صباح', 'مساء', 'hello', 'hi', 'hey', 'أهلاً', 'أهلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير'],
      weight: 1.0
    },
    search: {
      patterns: ['ابحث', 'بحث', 'اعطني', 'اريد', 'ارى', 'عندك', 'متوفر', 'عند', 'ابي', 'أبي', 'أريد', 'أعطني', 'أبحث', 'find', 'search', 'show', 'get', 'want', 'need', 'looking', 'have', 'do you have', 'هل عندك', 'هل يوجد', 'ما هو', 'ما هي', 'ما المنتجات'],
      weight: 0.9
    },
    price: {
      patterns: ['سعر', 'ثمن', 'تكلفة', 'بكم', 'كم سعر', 'كم ثمن', 'price', 'cost', 'how much', 'كم', 'ما السعر', 'ما الثمن', 'تكلف', 'بكام'],
      weight: 0.85
    },
    stock: {
      patterns: ['مخزون', 'متوفر', 'كم باقي', 'كم موجود', 'كم عندك', 'stock', 'available', 'inventory', 'quantity', 'كم', 'هل متوفر', 'هل موجود', 'هل عندك', 'باقي', 'موجود'],
      weight: 0.9
    },
    size: {
      patterns: ['مقاس', 'حجم', 'size', 'ما المقاسات', 'ما الأحجام'],
      weight: 0.8
    },
    color: {
      patterns: ['لون', 'ألوان', 'color', 'colors', 'colour', 'ما الألوان', 'ما اللون'],
      weight: 0.8
    },
    category: {
      patterns: ['فئة', 'تصنيف', 'category', 'categories', 'type', 'ما الفئات', 'ما التصنيفات'],
      weight: 0.75
    },
    comparison: {
      patterns: ['مقارنة', 'فرق', 'أفضل', 'أحسن', 'أرخص', 'أغلى', 'compare', 'difference', 'better', 'best', 'cheaper', 'expensive', 'ما الفرق', 'أيهما أفضل'],
      weight: 0.7
    },
    recommendation: {
      patterns: ['أنصح', 'أنصحيني', 'اقترح', 'اقترحي', 'recommend', 'suggest', 'what do you recommend', 'ما تنصح', 'ما تقترح'],
      weight: 0.8
    },
    help: {
      patterns: ['مساعدة', 'help', 'ماذا يمكنك', 'what can you', 'ممكن', 'كيف', 'how', 'ماذا تفعل', 'ما قدرتك'],
      weight: 0.9
    },
  }
  
  let bestIntent: 'search' | 'price' | 'stock' | 'size' | 'color' | 'category' | 'help' | 'greeting' | 'comparison' | 'recommendation' | 'general' = 'general'
  let maxConfidence = 0
  
  // Score each intent
  for (const [intentName, intentData] of Object.entries(intentPatterns)) {
    let score = 0
    for (const pattern of intentData.patterns) {
      if (lower.includes(pattern)) {
        score += intentData.weight
        // Boost if pattern is at the beginning
        if (lower.startsWith(pattern)) score += 0.2
      }
    }
    if (score > maxConfidence) {
      maxConfidence = score
      bestIntent = intentName as any
    }
  }
  
  // Context-based intent adjustment
  if (context?.lastIntent === 'search' && context.lastProduct && (lower.includes('هذا') || lower.includes('هذه') || lower.includes('it') || lower.includes('this'))) {
    bestIntent = 'general' // Likely follow-up question
    maxConfidence = 0.8
  }
  
  // Extract entities with improved patterns
  const entities: { type: 'product' | 'size' | 'color' | 'price_range' | 'number', value: string }[] = []
  
  // Extract size with multiple patterns
  const sizePatterns = [
    /\b(مقاس|حجم)\s*(\d+|حر|free|واحد|اثنين)\b/i,
    /\b(\d+|حر|free|واحد|اثنين)\s*(مقاس|حجم)\b/i,
    /\b(مقاس|حجم)\s*(\d+)\b/i,
    /\b(مقاس|حجم)\s*(حر|free)\b/i
  ]
  for (const pattern of sizePatterns) {
    const match = message.match(pattern)
    if (match) {
      let sizeValue = match[2] || match[1]
      // Normalize size values
      if (sizeValue === 'واحد' || sizeValue === '1') sizeValue = '1'
      if (sizeValue === 'اثنين' || sizeValue === '2') sizeValue = '2'
      if (sizeValue === 'حر' || sizeValue === 'free') sizeValue = 'حر'
      entities.push({ type: 'size', value: sizeValue })
      break
    }
  }
  
  // Extract color with fuzzy matching
  const colors = ['أسود', 'أبيض', 'اوف وايت', 'بترولي', 'جنزاري', 'بني', 'جملي', 'اخضر', 'زيتي', 'زيتوني', 'منت جرين', 'احمر', 'نبيتي', 'بتنجاني', 'عنابي', 'اصفر', 'مستطرده', 'سيمون', 'دهبي', 'فضي', 'رصاصي', 'ازرق', 'زهري', 'كحلي', 'بيبي بلو', 'بيج', 'ازرق سماوي', 'لافندر', 'برجاندي', 'كشميري', 'موف', 'روز', 'تركواز']
  for (const color of colors) {
    const similarity = calculateSimilarity(lower, color.toLowerCase())
    if (similarity > 0.6 || lower.includes(color.toLowerCase().substring(0, 3))) {
      entities.push({ type: 'color', value: color })
      break
    }
  }
  
  // Extract price range
  const pricePatterns = [
    /(\d+)\s*(?:-|إلى|to|من|from)\s*(\d+)\s*(?:جنيه|ج\.م|egp|le|ريال)/i,
    /(?:من|from)\s*(\d+)\s*(?:إلى|to)\s*(\d+)/i,
    /(?:أقل|less than|under|أقل من)\s*(\d+)/i,
    /(?:أكثر|more than|above|أكثر من)\s*(\d+)/i
  ]
  for (const pattern of pricePatterns) {
    const match = message.match(pattern)
    if (match) {
      if (match[2]) {
        entities.push({ type: 'price_range', value: `${match[1]}-${match[2]}` })
      } else {
        entities.push({ type: 'number', value: match[1] })
      }
      break
    }
  }
  
  // Extract numbers
  const numberMatch = message.match(/\b(\d+)\b/)
  if (numberMatch && !entities.some(e => e.type === 'size' || e.type === 'price_range')) {
    entities.push({ type: 'number', value: numberMatch[1] })
  }
  
  // Extract product name (remaining meaningful words)
  const stopWords = new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'كم', 'ما', 'هل', 'أين', 'متى', 'كيف', 'لماذا', 'why', 'when', 'where', 'how', 'what', 'which', 'who'])
  const productKeywords = words.filter(w => 
    !stopWords.has(w) &&
    w.length > 2 &&
    !intentPatterns.greeting.patterns.some(p => w.includes(p)) &&
    !intentPatterns.search.patterns.some(p => w.includes(p)) &&
    !intentPatterns.price.patterns.some(p => w.includes(p)) &&
    !intentPatterns.stock.patterns.some(p => w.includes(p))
  )
  
  if (productKeywords.length > 0) {
    entities.push({ type: 'product', value: productKeywords.join(' ') })
  }
  
  return { 
    intent: bestIntent, 
    confidence: Math.min(maxConfidence, 1.0),
    keywords: productKeywords, 
    entities 
  }
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'مرحباً! 👋 أنا مساعدك الذكي في متجر قوت للعبايات. يمكنك سؤالي بأي طريقة طبيعية عن المنتجات، الأسعار، المقاسات، الألوان، أو أي شيء آخر!',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [context, setContext] = useState<ConversationContext>({ mentionedProducts: [] })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadStoreData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadStoreData = async () => {
    try {
      // First, get store location
      let storeLocationId: string | null = null
      try {
        const locationsRes = await axios.get(`${API_URL}/inventory/locations`)
        const locations = locationsRes.data.data || locationsRes.data || []
        const storeLocation = locations.find((loc: any) => 
          loc.name?.toLowerCase().includes('store') || 
          loc.name?.toLowerCase().includes('متجر')
        ) || locations[0]
        if (storeLocation) {
          storeLocationId = storeLocation.id
        }
      } catch (err) {
        console.log('Could not fetch locations, will fetch stock per variant')
      }

      const [productsRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/products`, { 
          params: { 
            isActive: true,
            ...(storeLocationId ? { locationId: storeLocationId } : {})
          } 
        }),
        axios.get(`${API_URL}/products/categories`),
      ])
      const allProducts = productsRes.data.data || []
      
      // Load full product details with variants and stock
      const productsWithDetails = await Promise.all(
        allProducts.slice(0, 100).map(async (product: any) => {
          try {
            const detailRes = await axios.get(`${API_URL}/products/${product.id}`)
            const productData = detailRes.data.data || product
            
            // If variants don't have stockQuantity, fetch stock for each variant
            if (productData.variants && productData.variants.length > 0) {
              const variantsWithStock = await Promise.all(
                productData.variants.map(async (variant: any) => {
                  // If stockQuantity already exists, keep it
                  if (variant.stockQuantity !== undefined && variant.stockQuantity !== null) {
                    return variant
                  }
                  
                  // Otherwise, fetch stock information
                  try {
                    const stockRes = await axios.get(`${API_URL}/inventory/stock/${variant.id}`)
                    const stockData = stockRes.data.data || stockRes.data || []
                    const stockArray = Array.isArray(stockData) ? stockData : [stockData]
                    
                    // Find store location or sum all locations
                    let totalStock = 0
                    if (storeLocationId) {
                      const locationStock = stockArray.find((s: any) => s.locationId === storeLocationId)
                      totalStock = locationStock ? parseInt(locationStock.quantity || '0') : 0
                    } else {
                      // Sum all locations if no specific location
                      totalStock = stockArray.reduce((sum: number, s: any) => {
                        return sum + parseInt(s.quantity || '0')
                      }, 0)
                    }
                    
                    return {
                      ...variant,
                      stockQuantity: totalStock
                    }
                  } catch (stockErr) {
                    // If stock fetch fails, set to 0
                    return {
                      ...variant,
                      stockQuantity: 0
                    }
                  }
                })
              )
              
              return {
                ...productData,
                variants: variantsWithStock
              }
            }
            
            return productData
          } catch {
            return product
          }
        })
      )
      setProducts(productsWithDetails)
      setCategories(categoriesRes.data.data || [])
    } catch (error) {
      console.error('Error loading store data:', error)
    }
  }

  // Advanced product search with multiple scoring factors
  const searchProducts = (query: string, filters?: { size?: string, color?: string, maxPrice?: number, minPrice?: number }): any[] => {
    if (!query || query.trim().length === 0) {
      let results = [...products]
      if (filters?.size) {
        results = results.filter(p => {
          const variants = p.variants || []
          return variants.some((v: any) => {
            const sizeName = (v.size?.nameAr || v.size?.nameEn || v.size?.code || '').toLowerCase()
            const sizeMatch = filters.size?.toLowerCase() || ''
            const normalizedSize = sizeMatch === '1' || sizeMatch === 'واحد' ? '1' : sizeMatch === '2' || sizeMatch === 'اثنين' ? '2' : sizeMatch
            return (sizeName.includes(normalizedSize) || normalizedSize.includes(sizeName)) && (v.stockQuantity || 0) > 0
          })
        })
      }
      if (filters?.color) {
        results = results.filter(p => {
          const variants = p.variants || []
          return variants.some((v: any) => {
            const colorName = (v.color?.nameAr || v.color?.nameEn || '').toLowerCase()
            return colorName.includes(filters.color?.toLowerCase() || '') && (v.stockQuantity || 0) > 0
          })
        })
      }
      if (filters?.maxPrice) {
        results = results.filter(p => parseFloat(p.retailPrice || '0') <= (filters.maxPrice || Infinity))
      }
      if (filters?.minPrice) {
        results = results.filter(p => parseFloat(p.retailPrice || '0') >= (filters.minPrice || 0))
      }
      return results
    }

    const queryLower = query.toLowerCase().trim()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1)

    // Multi-factor scoring
    const scoredProducts = products.map(product => {
      const nameAr = (product.nameAr || '').toLowerCase()
      const nameEn = (product.nameEn || '').toLowerCase()
      const descAr = (product.descriptionAr || '').toLowerCase()
      const descEn = (product.descriptionEn || '').toLowerCase()
      const sku = (product.sku || '').toLowerCase()
      const fullText = `${nameAr} ${nameEn} ${descAr} ${descEn} ${sku}`

      let score = 0

      // Exact match in name (highest priority)
      if (nameAr === queryLower || nameEn === queryLower) {
        score += 200
      } else if (nameAr.includes(queryLower) || nameEn.includes(queryLower)) {
        score += 100
      }

      // Word-by-word matching with position weighting
      queryWords.forEach((word, idx) => {
        const positionWeight = 1 - (idx * 0.1) // First words are more important
        if (nameAr.includes(word)) score += 40 * positionWeight
        if (nameEn.includes(word)) score += 40 * positionWeight
        if (descAr.includes(word)) score += 15 * positionWeight
        if (descEn.includes(word)) score += 15 * positionWeight
        if (sku.includes(word)) score += 30 * positionWeight
      })

      // Fuzzy matching with similarity score
      const nameSimilarity = Math.max(
        calculateSimilarity(queryLower, nameAr),
        calculateSimilarity(queryLower, nameEn)
      )
      score += nameSimilarity * 50

      // Partial word matching
      queryWords.forEach(word => {
        if (word.length >= 3) {
          const partialMatches = fullText.match(new RegExp(word.substring(0, 3), 'gi'))
          if (partialMatches) score += partialMatches.length * 5
        }
      })

      // Apply filters
      if (filters?.size) {
        const variants = product.variants || []
        const hasSize = variants.some((v: any) => {
          const sizeName = (v.size?.nameAr || v.size?.nameEn || v.size?.code || '').toLowerCase()
          const sizeMatch = filters.size?.toLowerCase() || ''
          const normalizedSize = sizeMatch === '1' || sizeMatch === 'واحد' ? '1' : sizeMatch === '2' || sizeMatch === 'اثنين' ? '2' : sizeMatch
          return (sizeName.includes(normalizedSize) || normalizedSize.includes(sizeName)) && (v.stockQuantity || 0) > 0
        })
        if (!hasSize) score = 0
      }

      if (filters?.color) {
        const variants = product.variants || []
        const hasColor = variants.some((v: any) => {
          const colorName = (v.color?.nameAr || v.color?.nameEn || '').toLowerCase()
          return colorName.includes(filters.color?.toLowerCase() || '') && (v.stockQuantity || 0) > 0
        })
        if (!hasColor) score = 0
      }

      if (filters?.maxPrice) {
        if (parseFloat(product.retailPrice || '0') > (filters.maxPrice || Infinity)) {
          score = 0
        }
      }

      if (filters?.minPrice) {
        if (parseFloat(product.retailPrice || '0') < (filters.minPrice || 0)) {
          score = 0
        }
      }

      // Boost featured products
      if (product.isFeatured) score += 10

      return { product, score }
    })

    // Sort by score and return top results
    return scoredProducts
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product)
  }

  const processMessage = async (userMessage: string): Promise<string> => {
    const { intent, confidence, keywords, entities } = extractIntent(userMessage, context)
    const query = keywords.join(' ') || userMessage

    // Update context
    const newContext = { ...context }

    // Handle greetings
    if (intent === 'greeting') {
      return 'مرحباً بك! 😊 أنا هنا لمساعدتك في العثور على ما تبحثين عنه. يمكنك سؤالي بأي طريقة طبيعية عن المنتجات، الأسعار، المقاسات، الألوان، أو أي شيء آخر!'
    }

    // Handle help
    if (intent === 'help') {
      return `💡 يمكنني مساعدتك في:\n\n🔍 البحث عن المنتجات (مثلاً: "عندك عبايات سوداء؟" أو "ابحث عن عبايات")\n💰 معرفة الأسعار (مثلاً: "كم سعر العبايات؟" أو "بكم العباية")\n📏 المقاسات المتوفرة (مثلاً: "عندك مقاس 1؟")\n🎨 الألوان المتوفرة (مثلاً: "عندك لون أسود؟")\n📦 حالة المخزون (مثلاً: "كم باقي من هذا المنتج؟")\n📂 الفئات\n💡 التوصيات (مثلاً: "أنصحيني بمنتج")\n\nفقط اسأليني بأي طريقة طبيعية! 😊`
    }

    // Extract filters from entities
    const sizeFilter = entities.find(e => e.type === 'size')?.value
    const colorFilter = entities.find(e => e.type === 'color')?.value
    const priceRange = entities.find(e => e.type === 'price_range')?.value
    const productQuery = entities.find(e => e.type === 'product')?.value || query

    // Handle recommendations
    if (intent === 'recommendation') {
      const filters: any = {}
      if (sizeFilter) filters.size = sizeFilter
      if (colorFilter) filters.color = colorFilter
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number)
        filters.minPrice = min
        filters.maxPrice = max
      }

      const recommended = searchProducts('', filters)
      if (recommended.length > 0) {
        const product = recommended[Math.floor(Math.random() * Math.min(3, recommended.length))]
        newContext.lastProduct = product
        const variants = product.variants || []
        const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)
        return `💡 أنصحك بـ "${product.nameAr}"! ✨\n\n📋 التفاصيل:\n• السعر: ${parseFloat(product.retailPrice || '0').toFixed(2)} جنيه\n• المخزون: ${totalStock} قطعة\n• ${product.isFeatured ? '⭐ منتج مميز' : ''}\n\n${product.descriptionAr || product.descriptionEn || 'منتج عالي الجودة'}\n\nهل تريدين معرفة المزيد؟`
      }
      return 'عذراً، لا أستطيع تقديم توصية في الوقت الحالي. جربي البحث عن منتج معين!'
    }

    // Handle product search
    if (intent === 'search' || (intent === 'general' && productQuery.length > 0 && confidence > 0.3)) {
      const filters: any = {}
      if (sizeFilter) filters.size = sizeFilter
      if (colorFilter) filters.color = colorFilter
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number)
        filters.minPrice = min
        filters.maxPrice = max
      }

      const found = searchProducts(productQuery, filters)

      if (found.length > 0) {
        const product = found[0]
        newContext.lastProduct = product
        newContext.lastIntent = 'search'
        const variants = product.variants || []
        const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)
        const availableVariants = variants.filter((v: any) => (v.stockQuantity || 0) > 0)
        const sizes = [...new Set(availableVariants.map((v: any) => v.size?.nameAr || v.size?.nameEn || v.size?.code || '').filter(Boolean))]
        const colors = [...new Set(availableVariants.map((v: any) => v.color?.nameAr || v.color?.nameEn || v.color?.code || '').filter(Boolean))]

        let response = `وجدت "${product.nameAr}"! ✨\n\n📋 التفاصيل:\n• السعر: ${parseFloat(product.retailPrice || '0').toFixed(2)} جنيه\n• المخزون الإجمالي: ${totalStock} قطعة\n• المتغيرات المتاحة: ${availableVariants.length} من ${variants.length}\n• الحالة: ${product.isActive ? '✅ متوفر' : '❌ غير متوفر'}\n`

        if (sizes.length > 0) {
          response += `• المقاسات المتوفرة: ${sizes.join(', ')}\n`
        }
        if (colors.length > 0) {
          response += `• الألوان المتوفرة: ${colors.join(', ')}\n`
        }

        if (product.descriptionAr || product.descriptionEn) {
          response += `\n📝 الوصف:\n${product.descriptionAr || product.descriptionEn}\n`
        }

        if (found.length > 1) {
          response += `\n💡 وجدت ${found.length} منتج مشابه. هل تريدين معرفة المزيد عن منتج آخر؟`
        } else {
          response += `\nهل تريدين معرفة المزيد عن هذا المنتج أو مقاس أو لون معين؟`
        }

        setContext(newContext)
        return response
      }

      // Try without filters if no results
      if (sizeFilter || colorFilter) {
        const foundWithoutFilters = searchProducts(productQuery)
        if (foundWithoutFilters.length > 0) {
          return `لم أجد منتجاً بهذه المواصفات بالضبط. 😔\n\nلكن وجدت ${foundWithoutFilters.length} منتج مشابه. هل تريدين أن أريك المنتجات المتوفرة؟`
        }
      }

      return `لم أجد منتجاً بهذا الاسم. 😔\n\nجربي البحث بكلمات أخرى أو اسأليني عن:\n• المنتجات المتوفرة\n• الأسعار\n• المقاسات\n• الألوان\n\nمثال: "عندك عبايات سوداء؟" أو "ابحث عن عبايات" أو "ما المنتجات المتوفرة؟"`
    }

    // Handle price questions with context
    if (intent === 'price') {
      if (context.lastProduct) {
        return `💰 سعر "${context.lastProduct.nameAr}" هو ${parseFloat(context.lastProduct.retailPrice || '0').toFixed(2)} جنيه.\n\nهل تريدين معرفة المزيد عن هذا المنتج؟`
      }
      
      if (productQuery && productQuery.length > 2) {
        const found = searchProducts(productQuery)
        if (found.length > 0) {
          const product = found[0]
          newContext.lastProduct = product
          setContext(newContext)
          return `💰 سعر "${product.nameAr}" هو ${parseFloat(product.retailPrice || '0').toFixed(2)} جنيه.\n\nهل تريدين معرفة المزيد عن هذا المنتج؟`
        }
      }

      const priceRange = products.map(p => parseFloat(p.retailPrice || '0')).filter(p => p > 0)
      if (priceRange.length === 0) {
        return 'عذراً، لا توجد معلومات عن الأسعار حالياً.'
      }
      const minPrice = Math.min(...priceRange)
      const maxPrice = Math.max(...priceRange)
      const avgPrice = priceRange.reduce((a, b) => a + b, 0) / priceRange.length

      return `💰 معلومات الأسعار:\n\n• أقل سعر: ${minPrice.toFixed(2)} جنيه\n• أعلى سعر: ${maxPrice.toFixed(2)} جنيه\n• متوسط السعر: ${avgPrice.toFixed(2)} جنيه\n\nهل تريدين معرفة سعر منتج معين؟`
    }

    // Handle stock questions with context
    if (intent === 'stock') {
      if (context.lastProduct) {
        const product = context.lastProduct
        const variants = product.variants || []
        const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)
        const availableVariants = variants.filter((v: any) => (v.stockQuantity || 0) > 0)
        return `📦 مخزون "${product.nameAr}":\n\n• إجمالي القطع المتوفرة: ${totalStock} قطعة\n• المتغيرات المتاحة: ${availableVariants.length} من ${variants.length}\n\nهل تريدين معرفة مخزون مقاس أو لون معين؟`
      }
      
      if (productQuery && productQuery.length > 2) {
        const found = searchProducts(productQuery)
        if (found.length > 0) {
          const product = found[0]
          newContext.lastProduct = product
          const variants = product.variants || []
          const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)
          const availableVariants = variants.filter((v: any) => (v.stockQuantity || 0) > 0)
          setContext(newContext)
          if (totalStock > 0) {
            return `📦 مخزون "${product.nameAr}":\n\n• إجمالي القطع المتوفرة: ${totalStock} قطعة\n• المتغيرات المتاحة: ${availableVariants.length} من ${variants.length}\n\nهل تريدين معرفة مخزون مقاس أو لون معين؟`
          } else {
            return `عذراً، "${product.nameAr}" غير متوفر حالياً في المخزون. 😔\n\nهل تريدين البحث عن منتج آخر؟`
          }
        }
      }

      const inStockProducts = products.filter(p => {
        const variants = p.variants || []
        return variants.some((v: any) => (v.stockQuantity || 0) > 0)
      })
      const outOfStockProducts = products.length - inStockProducts.length
      const totalStock = products.reduce((sum, p) => {
        const variants = p.variants || []
        return sum + variants.reduce((vSum: number, v: any) => vSum + (v.stockQuantity || 0), 0)
      }, 0)

      return `📦 حالة المخزون الشاملة:\n\n• المنتجات المتوفرة: ${inStockProducts.length}\n• المنتجات غير المتوفرة: ${outOfStockProducts}\n• إجمالي المنتجات: ${products.length}\n• إجمالي القطع في المخزون: ${totalStock} قطعة\n\nهل تريدين معرفة مخزون منتج معين أو مقاس أو لون محدد؟`
    }

    // Handle size questions
    if (intent === 'size') {
      if (sizeFilter) {
        const sizeMap: { [key: string]: string[] } = {
          '1': ['1'],
          '2': ['2'],
          'واحد': ['1'],
          'اثنين': ['2'],
          'حر': ['free', 'free_size', 'مقاس حر'],
          'free': ['free', 'free_size', 'مقاس حر']
        }
        const searchTerms = sizeMap[sizeFilter.toLowerCase()] || [sizeFilter]

        const availableProducts = products.filter(p => {
          const variants = p.variants || []
          return variants.some((v: any) => {
            const sizeName = (v.size?.nameAr || v.size?.nameEn || v.size?.code || '').toLowerCase()
            return searchTerms.some(term => sizeName.includes(term.toLowerCase())) && (v.stockQuantity || 0) > 0
          })
        })

        if (availableProducts.length > 0) {
          return `📏 المنتجات المتوفرة بمقاس ${sizeFilter}:\n\n${availableProducts.slice(0, 5).map((p, idx) => `${idx + 1}. ${p.nameAr} - ${parseFloat(p.retailPrice || '0').toFixed(2)} جنيه`).join('\n')}${availableProducts.length > 5 ? `\n\nو ${availableProducts.length - 5} منتج آخر...` : ''}\n\nهل تريدين معرفة المزيد عن أي منتج؟`
        }
        return `عذراً، لا يوجد منتجات متوفرة حالياً بمقاس ${sizeFilter}. 😔\n\nجربي مقاس آخر أو اسأليني عن المقاسات المتوفرة!`
      }

      return `📏 المقاسات المتوفرة:\n\n• 1\n• 2\n• مقاس حر\n\nجميع المنتجات متوفرة بهذه المقاسات. هل تريدين معرفة منتج معين متوفر بمقاس محدد؟`
    }

    // Handle color questions
    if (intent === 'color') {
      if (colorFilter) {
        const availableProducts = products.filter(p => {
          const variants = p.variants || []
          return variants.some((v: any) => {
            const colorName = (v.color?.nameAr || v.color?.nameEn || '').toLowerCase()
            return colorName.includes(colorFilter.toLowerCase()) && (v.stockQuantity || 0) > 0
          })
        })

        if (availableProducts.length > 0) {
          return `🎨 المنتجات المتوفرة بلون ${colorFilter}:\n\n${availableProducts.slice(0, 5).map((p, idx) => `${idx + 1}. ${p.nameAr} - ${parseFloat(p.retailPrice || '0').toFixed(2)} جنيه`).join('\n')}${availableProducts.length > 5 ? `\n\nو ${availableProducts.length - 5} منتج آخر...` : ''}\n\nهل تريدين معرفة المزيد عن أي منتج؟`
        }
        return `عذراً، لا يوجد منتجات متوفرة حالياً بلون ${colorFilter}. 😔\n\nجربي لون آخر أو اسأليني عن الألوان المتوفرة!`
      }

      return `🎨 الألوان المتوفرة:\n\nأسود، أبيض، اوف وايت، بترولي، جنزاري، بني، جملي، اخضر، زيتي، زيتوني، منت جرين، احمر، نبيتي، بتنجاني، عنابي، اصفر، مستطرده، سيمون، دهبي، فضي، رصاصي، ازرق، زهري، كحلي، بيبي بلو، بيج، ازرق سماوي، لافندر، برجاندي، كشميري، موف، روز، تركواز\n\nهل تريدين معرفة منتج متوفر بلون معين؟`
    }

    // Handle category questions
    if (intent === 'category') {
      if (categories.length > 0) {
        const categoriesList = categories.map(c => `• ${c.nameAr || c.nameEn}`).join('\n')
        return `📂 الفئات المتوفرة:\n\n${categoriesList}\n\nهل تريدين معرفة المنتجات في فئة معينة؟`
      }
      return `لدينا عدة فئات من المنتجات! هل تريدين معرفة منتجات فئة معينة؟`
    }

    // Handle comparison
    if (intent === 'comparison') {
      if (productQuery.length > 2) {
        const found = searchProducts(productQuery)
        if (found.length >= 2) {
          const [p1, p2] = found.slice(0, 2)
          return `📊 مقارنة بين المنتجين:\n\n"${p1.nameAr}":\n• السعر: ${parseFloat(p1.retailPrice || '0').toFixed(2)} جنيه\n• المخزون: ${(p1.variants || []).reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)} قطعة\n\n"${p2.nameAr}":\n• السعر: ${parseFloat(p2.retailPrice || '0').toFixed(2)} جنيه\n• المخزون: ${(p2.variants || []).reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)} قطعة\n\n${parseFloat(p1.retailPrice || '0') < parseFloat(p2.retailPrice || '0') ? `"${p1.nameAr}" أرخص` : `"${p2.nameAr}" أرخص`}`
        }
      }
      return 'عذراً، أحتاج إلى معرفة المنتجين للمقارنة. جربي: "ما الفرق بين [منتج 1] و [منتج 2]"'
    }

    // General/fallback - try to find relevant products
    if (query.length > 2) {
      const found = searchProducts(query)
      if (found.length > 0) {
        const product = found[0]
        newContext.lastProduct = product
        setContext(newContext)
        const variants = product.variants || []
        const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stockQuantity || 0), 0)
        return `وجدت منتجاً قد يهمك: "${product.nameAr}" ✨\n\n• السعر: ${parseFloat(product.retailPrice || '0').toFixed(2)} جنيه\n• المخزون: ${totalStock} قطعة\n\nهل تريدين معرفة المزيد عن هذا المنتج؟`
      }
    }

    // Generic helpful response
    return `شكراً لسؤالك! 😊\n\nيمكنني مساعدتك في:\n• البحث عن المنتجات (مثلاً: "عندك عبايات سوداء؟")\n• معرفة الأسعار والمقاسات\n• البحث حسب اللون أو المقاس\n• حالة المخزون التفصيلية\n• معلومات الفئات\n• التوصيات\n\nجربي أن تسأليني بأي طريقة طبيعية! مثلاً:\n• "عندك عبايات سوداء مقاس 1؟"\n• "كم سعر العبايات؟"\n• "ما المنتجات المتوفرة؟"\n• "أنصحيني بمنتج"`
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await processMessage(userMessage.content)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }
      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage])
        setLoading(false)
      }, 200)
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-r from-brand-brown to-brand-cafe text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300"
        aria-label="فتح المحادثة"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 w-80 sm:w-96 h-[500px] sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-brown to-brand-cafe text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base">مساعد قوت الذكي</h3>
                <p className="text-xs opacity-90">متصل الآن</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-brand-brown to-brand-cafe text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.content}</p>
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتبي رسالتك..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cafe focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="px-4 py-2 bg-gradient-to-r from-brand-brown to-brand-cafe text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
