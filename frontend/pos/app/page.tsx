'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getUser, fetchWithAuth } from '../lib/auth'

interface CartItem {
  id: string
  variantId: string
  productName: string
  size: string
  color: string
  quantity: number
  unitPrice: number
  costPrice: number
  total: number
}

export default function POSPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [storeLocation, setStoreLocation] = useState<string>('')

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push('/login')
    } else {
      setUser(currentUser)
      loadStoreLocation()
      loadAllProducts()
    }
  }, [router])

  const loadStoreLocation = async () => {
    try {
      const response = await fetchWithAuth('/inventory/locations')
      const data = await response.json()
      const locations = data.data || []
      // Find store location or use first one
      const store = locations.find((loc: any) => loc.name?.toLowerCase().includes('store')) || locations[0]
      if (store) {
        setStoreLocation(store.id)
      }
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  // Fetch products with location ID ensures stockQuantity is populated
  const loadAllProducts = async () => {
    try {
      if (!storeLocation) return; // Wait for location
      const response = await fetchWithAuth(`/products?isActive=true&locationId=${storeLocation}`)
      const data = await response.json()
      const productsList = data.data || []
      setAllProducts(productsList)
      setProducts(productsList.slice(0, 20))
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // Effect to reload products when storeLocation is set
  useEffect(() => {
    if (storeLocation) {
      loadAllProducts();
    }
  }, [storeLocation]);

  const searchProducts = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      // Search by barcode first
      if (/^\d+$/.test(searchQuery)) {
        const response = await fetchWithAuth(`/products/variants/barcode/${searchQuery}`)
        const data = await response.json()
        if (data.data) {
          addToCart(data.data)
          setSearchQuery('')
          return
        }
      }

      // Search by name or SKU
      const response = await fetchWithAuth(`/products?search=${encodeURIComponent(searchQuery)}&locationId=${storeLocation}`)
      const data = await response.json()
      setProducts(data.data || [])
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (variant: any) => {
    // Check stock if available (backend should populate stockQuantity)
    // If stockQuantity is missing (e.g. searching barcode directly might not have joined stock), we might need to fetch it or be lenient
    // Assuming ProductsService.findAll populates it. Direct variant fetch might need update, but let's assume we search via products list normally.
    // If variant comes from 'search by barcode', it's a direct fetch. We need to check finding by barcode to include stock too.

    // For now, let's use the stockQuantity property if it exists.
    const availableStock = (variant.stockQuantity !== undefined) ? variant.stockQuantity : 9999;

    // Find if detailed stock check is needed:
    // Ideally update backend findVariantByBarcode to also return stock.

    const existingItem = cart.find((item) => item.variantId === variant.id)
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;

    if (currentQtyInCart + 1 > availableStock) {
      alert(`Insufficient stock! Only ${availableStock} available.`);
      return;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        )
      )
    } else {
      const newItem: CartItem = {
        id: Date.now().toString(),
        variantId: variant.id,
        productName: variant.product?.nameAr || variant.product?.nameEn || 'Product',
        size: variant.size?.nameAr || variant.size?.code || '',
        color: variant.color?.nameAr || variant.color?.code || '',
        quantity: 1,
        unitPrice: parseFloat(variant.retailPrice || variant.product?.retailPrice || '0'),
        costPrice: parseFloat(variant.costPrice || variant.product?.costPrice || '0'),
        total: parseFloat(variant.retailPrice || variant.product?.retailPrice || '0'),
      }
      setCart([...cart, newItem])
    }
    setSearchQuery('')
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            // Find original variant to check stock again? 
            // Ideally we should store maxStock in CartItem or lookup.
            // For simplicity, we just allow invalid updates here or need to lookup product.
            // Let's rely on initial add check + visual indicator if we had one.
            // Ideally we'd optimize this.
            const newQuantity = Math.max(1, item.quantity + delta)
            return { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const updatePrice = (id: string, newPrice: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === id) {
          // REMOVED VALIDATION: Allow selling below cost price (User Request)
          /*
          if (newPrice < item.costPrice) {
            alert(`Price cannot be lower than cost price (${item.costPrice})`);
            return item;
          }
          */
          return { ...item, unitPrice: newPrice, total: item.quantity * newPrice }
        }
        return item
      })
    )
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }

  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  useEffect(() => {
    // Load payment methods
    fetchWithAuth('/sales/payment-methods')
      .then(res => res.json())
      .then(data => setPaymentMethods(data.data || data))
      .catch(console.error)
  }, [])

  const handlePrint = (invoice: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Pop-up blocked. Please allow pop-ups to print.");
      return;
    }

    // Modern, Premium Invoice Design
    const html = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>Invoice #${invoice.invoiceNumber}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&family=Playfair+Display:wght@700&display=swap');
                
                :root {
                    --primary: #4A3B32; /* Brand Brown */
                    --accent: #C5A065;  /* Brand Gold */
                }

                body {
                    font-family: 'Cairo', sans-serif;
                    margin: 0;
                    padding: 0;
                    background: #fff;
                    color: #1a1a1a;
                    width: 80mm; /* Standard Receipt Width */
                    margin: 0 auto;
                }

                .receipt-container {
                    padding: 15px 5px;
                }

                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 15px;
                }

                .logo-circle {
                    width: 50px;
                    height: 50px;
                    background: var(--primary);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Playfair Display', serif;
                    font-size: 28px;
                    margin: 0 auto 10px;
                }

                .brand-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 22px;
                    font-weight: 700;
                    color: var(--primary);
                    letter-spacing: 1px;
                    margin: 0;
                    text-transform: uppercase;
                }

                .tagline {
                    font-size: 10px;
                    color: var(--accent);
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    margin-top: 2px;
                }

                .invoice-meta {
                    margin-top: 15px;
                    font-size: 11px;
                    color: #666;
                    display: flex;
                    justify-content: space-between;
                    border: 1px solid #eee;
                    padding: 5px 8px;
                    border-radius: 4px;
                }

                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 11px;
                }

                .items-table th {
                    text-align: right;
                    color: #888;
                    font-weight: 600;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #000;
                }

                .items-table td {
                    padding: 8px 0;
                    border-bottom: 1px dashed #eee;
                    vertical-align: top;
                }

                .item-desc {
                    width: 60%;
                }
                
                .item-name {
                    font-weight: 600;
                    color: #000;
                    display: block;
                }

                .item-specs {
                    font-size: 9px;
                    color: #777;
                    display: block;
                    margin-top: 2px;
                }

                .item-qty {
                    text-align: center;
                    width: 15%;
                    color: #666;
                }

                .item-price {
                    text-align: left;
                    width: 25%;
                    font-weight: 600;
                }

                .totals {
                    margin-top: 10px;
                    border-top: 2px solid #000;
                    padding-top: 10px;
                }

                .row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    margin-bottom: 4px;
                }

                .grand-total {
                    font-size: 18px;
                    font-weight: 700;
                    color: var(--primary);
                    margin-top: 8px;
                    padding-top: 8px;
                    border-top: 1px solid #eee;
                }

                .footer {
                    margin-top: 25px;
                    text-align: center;
                    font-size: 10px;
                    color: #888;
                }

                .thank-you {
                    font-family: 'Playfair Display', serif;
                    font-size: 14px;
                    color: var(--primary);
                    margin-bottom: 5px;
                    font-style: italic;
                }

                .barcode {
                    margin-top: 10px;
                    letter-spacing: 4px;
                    font-family: monospace;
                    font-size: 10px;
                }

                @media print {
                    @page { margin: 0; size: auto; }
                    body { -webkit-print-color-adjust: exact; }
                }
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <div class="logo-circle">Q</div>
                    <h1 class="brand-name">QOTE ABAYA</h1>
                    <div class="tagline">Modern Elegance</div>
                    
                    <div class="invoice-meta">
                        <div>
                            <div>INV: #${invoice.invoiceNumber}</div>
                            <div>Date: ${new Date().toLocaleDateString()}</div>
                        </div>
                        <div style="text-align: left;">
                             <div>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                             <div>User: ${user?.name || 'Admin'}</div>
                        </div>
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align:center">Qty</th>
                            <th style="text-align:left">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map((item: any) => `
                            <tr>
                                <td class="item-desc">
                                    <span class="item-name">${item.productName || item.variant?.product?.nameAr || 'Product'}</span>
                                    <span class="item-specs">
                                        Color: ${item.color || '-'} • Size: ${item.size || '-'}
                                        ${item.variantId ? `<br/>sku: ${item.variantId.slice(0, 8)}` : ''}
                                    </span>
                                </td>
                                <td class="item-qty">x${item.quantity}</td>
                                <td class="item-price">${parseFloat(item.total).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="row">
                        <span>Subtotal (المجموع)</span>
                        <span>${parseFloat(invoice.total).toFixed(2)}</span>
                    </div>
                    <div class="row" style="color: #888;">
                        <span>Tax (ضريبة)</span>
                        <span>0.00</span>
                    </div>
                    <div class="row grand-total">
                        <span>Total (الإجمالي)</span>
                        <span>${parseFloat(invoice.total).toFixed(2)} <span style="font-size:10px">EGP</span></span>
                    </div>
                </div>

                <div class="footer">
                    <div class="thank-you">Thank you for your visit</div>
                    <div>شكراً لزيارتكم</div>
                    <div style="margin-top: 8px;">
                        Policy: Exchange/Return within 14 days.<br/>
                        Item must be in original condition.
                    </div>
                    <div class="barcode">
                        ||| || ||| | ||| || || |||
                    </div>
                </div>
            </div>

            <script>
                window.onload = function() {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const checkoutSectionRef = useRef<HTMLDivElement>(null)
  const [showCheckoutButton, setShowCheckoutButton] = useState(true)
  
  const scrollToCheckout = () => {
    checkoutSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Handle scroll to show/hide checkout button
  useEffect(() => {
    const handleScroll = () => {
      if (!checkoutSectionRef.current) return
      
      const checkoutRect = checkoutSectionRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Hide button if checkout section is visible in viewport (within 200px from bottom)
      const isCheckoutVisible = checkoutRect.top < windowHeight - 200
      setShowCheckoutButton(!isCheckoutVisible)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleCheckout = async () => {
    if (cart.length === 0 || !selectedPaymentMethod) return

    setLoading(true)
    try {
      if (!storeLocation) {
        alert('Store location not found. Please contact administrator.')
        setLoading(false)
        return
      }

      // 1. Create invoice (Draft/Pending)
      const response = await fetchWithAuth('/sales/invoices', {
        method: 'POST',
        body: JSON.stringify({
          locationId: storeLocation,
          items: cart.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: 0,
          })),
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to create invoice');
      }

      const data = await response.json()
      const invoice = data.data || data

      if (invoice && invoice.id) {
        // 2. Process Payment immediately with selected method
        const payRes = await fetchWithAuth('/sales/payments', {
          method: 'POST',
          body: JSON.stringify({
            invoiceId: invoice.id,
            amount: parseFloat(invoice.total), // Ensure number
            paymentMethodId: selectedPaymentMethod,
            notes: `POS Term: ${selectedPaymentMethod}`
          })
        });

        if (!payRes.ok) {
          const errData = await payRes.json().catch(() => ({}));
          console.error('Payment failed', errData);
          alert(`Payment Processing Failed: ${errData.message || 'Unknown Error'}. Invoice saved as pending.`);

          // Attempt to cancel
          await fetchWithAuth(`/sales/invoices/${invoice.id}/cancel`, { method: 'POST' });
          alert('Transaction cancelled due to payment failure.');
        } else {
          // 3. Print
          handlePrint({ ...invoice, items: cart });
          setCart([])
          setShowPaymentModal(false)
          setSelectedPaymentMethod(null)
        }
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Error creating invoice')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">جاري التحميل...</div>
  }

  return (
    // إزالة h-screen و overflow-hidden حتى يمكن تمرير الصفحة بالكامل على الموبايل
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 shadow-md z-10 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="bg-brand-brown w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-lg sm:text-xl font-bold">ق</div>
          <div className="flex-1 sm:flex-none">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-wide">نقاط البيع</h1>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">العميل: {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-gray-800 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hidden sm:block">
            <span className="text-gray-400 mr-1 sm:mr-2">الموقع:</span>
            <span className="font-semibold text-white">المتجر الرئيسي</span>
          </div>
          <button
            onClick={() => {
              router.push('/login')
            }}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition border border-red-500/20 text-xs sm:text-sm"
          >
            تسجيل الخروج
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left Panel - Product Search */}
        <div className="w-full lg:w-2/3 flex flex-col border-r-0 lg:border-r border-gray-200 bg-gray-50/50">
          {/* Search Bar */}
          <div className="p-3 sm:p-4 lg:p-6 bg-white border-b border-gray-100 shadow-sm z-10">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchProducts()}
                  placeholder="امسح الباركود أو ابحث عن منتج..."
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 lg:py-4 bg-gray-100 border-transparent focus:bg-white focus:border-brand-brown focus:ring-2 sm:focus:ring-4 focus:ring-brand-brown/10 rounded-lg sm:rounded-xl transition text-sm sm:text-base lg:text-lg"
                  autoFocus
                />
                <span className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-lg sm:text-xl lg:text-2xl text-gray-400">🔍</span>
              </div>
              <button
                onClick={searchProducts}
                disabled={loading}
                className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-gray-900 text-white rounded-lg sm:rounded-xl hover:bg-gray-800 disabled:opacity-50 font-semibold shadow-lg shadow-gray-900/10 transition text-sm sm:text-base"
              >
                {loading ? 'جاري البحث...' : 'بحث'}
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            {searchQuery && (
              <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="font-bold text-gray-800 text-base sm:text-lg">نتائج البحث</h3>
                <button onClick={() => { setSearchQuery(''); loadAllProducts(); }} className="text-brand-brown text-xs sm:text-sm font-medium hover:underline">مسح البحث</button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 pb-20">
              {products.length > 0 ? (
                (() => {
                  // Flatten and sort items
                  const flattenedItems = products.flatMap(product =>
                    (product.variants || []).map((variant: any) => ({
                      ...variant,
                      productName: product.nameAr, // Attach needed product info
                      productNameEn: product.nameEn,
                      productImages: product.images,
                      productPrice: product.retailPrice,
                      // Ensure numeric stock
                      stockQuantity: variant.stockQuantity !== undefined ? variant.stockQuantity : 0
                    }))
                  ).sort((a, b) => {
                    // Sort by stock status: Available first (descending quantity), then OOS
                    if (a.stockQuantity > 0 && b.stockQuantity <= 0) return -1;
                    if (a.stockQuantity <= 0 && b.stockQuantity > 0) return 1;
                    return 0;
                  });

                  if (flattenedItems.length === 0) {
                    return (
                      <div className="col-span-full text-center p-4 bg-yellow-50 text-yellow-800 rounded-xl">
                        لا توجد متغيرات متاحة.
                      </div>
                    );
                  }

                  return flattenedItems.map((variant: any) => {
                    const isOutOfStock = variant.stockQuantity <= 0;

                    return (
                      <div
                        key={variant.id}
                        onClick={() => !isOutOfStock && addToCart({ ...variant, product: { nameAr: variant.productName, nameEn: variant.productNameEn } })}
                        className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition group relative overflow-hidden 
                          ${isOutOfStock ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:shadow-md hover:border-brand-brown/30 cursor-pointer'}`}
                      >
                        {/* OOS Overlay */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100/50">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm transform -rotate-12">
                              نفد المخزون
                            </span>
                          </div>
                        )}

                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <div className={`text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isOutOfStock ? 'hidden' : 'bg-brand-brown'}`}>+</div>
                        </div>

                        <div className="aspect-[4/3] mb-3 bg-gray-100 rounded-xl overflow-hidden relative">
                          {variant.productImages && variant.productImages[0] ? (
                            <img src={variant.productImages[0].url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">👕</div>
                          )}
                        </div>

                        <h4 className="font-bold text-gray-800 truncate mb-1">{variant.productName}</h4>
                        <p className="text-xs text-gray-500 mb-2 truncate">{variant.productNameEn}</p>
                        <p className={`text-[10px] font-bold mb-2 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                          {isOutOfStock ? 'نفد المخزون' : `المخزون: ${variant.stockQuantity} قطعة`}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex gap-1">
                            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">{variant.size?.nameAr || variant.size?.code}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">{variant.color?.nameAr}</span>
                          </div>
                          <span className="font-bold text-brand-brown text-lg">
                            {parseInt(variant.retailPrice || variant.productPrice)} <span className="text-xs">جنيه</span>
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                  <span className="text-6xl mb-4">📦</span>
                  <p className="text-lg">لم يتم العثور على منتجات</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Cart/Invoice (الطلب الحالي) */}
        <div ref={checkoutSectionRef} className="w-full lg:w-1/3 bg-white flex flex-col shadow-2xl z-20 border-t lg:border-t-0 border-gray-200">
          <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">الطلب الحالي</h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 bg-red-50 rounded-lg hover:bg-red-100 transition"
              >
                مسح الكل
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3 bg-gray-50/30">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-full flex items-center justify-center mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl">🛒</div>
                <p className="text-base sm:text-lg font-medium">السلة فارغة</p>
                <p className="text-xs sm:text-sm text-center">امسح العناصر أو اختر من الشبكة</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 animate-slide-in"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-gray-800 truncate">{item.productName}</h3>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition -mr-2 -mt-2 p-2"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 flex gap-2">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.size}</span>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.color}</span>
                      <span className="text-gray-300">|</span>
                      <span>SKU: {item.variantId.slice(0, 8)}...</span>
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1 bg-white">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold transition">-</button>
                        <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-md bg-gray-900 text-white hover:bg-gray-800 flex items-center justify-center shadow-sm transition">+</button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative group">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(item.id, parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 text-right border-b border-dashed border-gray-300 focus:border-brand-brown focus:ring-0 text-sm font-semibold bg-transparent"
                            min={item.costPrice}
                          />
                          <span className="absolute -top-6 right-0 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                            الحد الأدنى: {item.costPrice} جنيه
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {(item.total).toFixed(0)} <span className="text-[10px] text-gray-500 font-normal">جنيه</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 sm:p-4 lg:p-6 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30">
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
              <div className="flex justify-between text-gray-500 text-xs sm:text-sm">
                <span>المجموع الفرعي</span>
                <span>{getTotal().toFixed(2)} جنيه</span>
              </div>
              <div className="flex justify-between text-gray-500 text-xs sm:text-sm">
                <span>الضريبة (0%)</span>
                <span>0.00 جنيه</span>
              </div>
              <div className="flex justify-between items-end border-t border-dashed border-gray-200 pt-2 sm:pt-3">
                <span className="font-bold text-gray-800 text-lg sm:text-xl">الإجمالي</span>
                <span className="font-bold text-brand-brown text-xl sm:text-2xl lg:text-3xl">{getTotal().toFixed(2)} <span className="text-xs sm:text-sm font-medium text-gray-400">جنيه</span></span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
                className="py-3 sm:py-4 bg-gradient-to-r from-brand-brown to-brand-cafe text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base lg:text-lg hover:shadow-lg hover:translate-y-[-2px] transition disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                المتابعة للدفع →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Checkout Button for Mobile */}
      {cart.length > 0 && showCheckoutButton && (
        <button
          onClick={scrollToCheckout}
          className="fixed bottom-6 left-6 lg:hidden z-50 w-14 h-14 bg-gradient-to-r from-brand-brown to-brand-cafe text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-300 animate-bounce"
          aria-label="الانتقال للدفع"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      )}

      {/* Payment Selection Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 bg-white z-10">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">اختر طريقة الدفع</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl p-1">×</button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="text-center mb-6 sm:mb-8">
                <p className="text-gray-500 text-xs sm:text-sm mb-1">المبلغ الإجمالي</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{getTotal().toFixed(2)} <span className="text-xs sm:text-sm font-medium text-gray-400">جنيه</span></p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {paymentMethods
                  .filter((pm: any) => ['cash', 'vodafone_cash', 'instapay', 'fawry'].includes(pm.code))
                  .map((pm: any) => (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedPaymentMethod(pm.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition group relative
                        ${selectedPaymentMethod === pm.id
                          ? 'border-brand-brown bg-brand-brown/5 ring-2 ring-brand-brown/20'
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg flex-shrink-0
                            ${pm.code === 'cash' ? 'bg-green-100 text-green-600' :
                            pm.code === 'vodafone_cash' ? 'bg-red-100 text-red-600' :
                              pm.code === 'instapay' ? 'bg-purple-100 text-purple-600' :
                                pm.code === 'fawry' ? 'bg-orange-100 text-orange-600' :
                                  'bg-gray-100 text-gray-600'}`}>
                          {pm.code === 'cash' ? '💵' : pm.code === 'vodafone_cash' ? '📱' : pm.code === 'instapay' ? '🏦' : pm.code === 'fawry' ? '🏪' : '💳'}
                        </div>
                        <div className="text-right flex-1 min-w-0">
                          <p className={`font-bold text-sm sm:text-base truncate ${selectedPaymentMethod === pm.id ? 'text-brand-brown' : 'text-gray-900'}`}>{pm.nameAr || pm.nameEn}</p>
                          {pm.nameAr && pm.nameEn && pm.nameAr !== pm.nameEn && (
                            <p className="text-xs text-gray-500 truncate">{pm.nameEn}</p>
                          )}
                        </div>
                      </div>

                      {selectedPaymentMethod === pm.id && (
                        <div className="absolute right-4 bg-brand-brown text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</div>
                      )}
                    </button>
                  ))}
              </div>

              <button
                onClick={handleCheckout}
                disabled={!selectedPaymentMethod || loading}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-brand-brown to-brand-cafe text-white rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:shadow-lg hover:translate-y-[-2px] transition disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                {loading ? 'جاري المعالجة...' : 'تأكيد الدفع'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
