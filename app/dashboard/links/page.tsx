'use client';
import React, { useState, useEffect } from 'react';
import { Package, Link as LinkIcon, Loader2, ExternalLink, Search, X, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  imageUrl: string | null;
  price?: string;
}

interface AffiliateLink {
  _id: string;
  discountCode: string;
  trackingUrl: string;
  shopifyProductHandle?: string;
  clicks: number;
  productSalesCount: number;
  creatorId?: {
    name: string;
    profileImage?: string;
  };
  customCreatorName?: string;
}

export default function ProductsAndLinksPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shopifyDomain, setShopifyDomain] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Manual generation state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newCommission, setNewCommission] = useState('15');
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    const fetchProductsAndProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.replace('/login');
          return;
        }

        // Fetch profile first to get domain and check connection
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/brand-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = await profileRes.json();

        if (!profileRes.ok || !profileData.isShopifyConnected) {
          setError('Please connect your store first.');
          setLoading(false);
          return;
        }

        setShopifyDomain(profileData.shopifyDomain);

        // Fetch products and affiliates concurrently
        const [productsRes, affiliatesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/products`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/affiliates/brand`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        const productsData = await productsRes.json();
        const affiliatesData = await affiliatesRes.json();

        if (productsRes.ok && productsData.products) {
          setProducts(productsData.products);
        } else {
          throw new Error('Failed to load products');
        }

        if (affiliatesRes.ok && Array.isArray(affiliatesData)) {
          setAffiliates(affiliatesData);
        }

      } catch (err: any) {
        console.error('Failed to fetch data', err);
        setError(err.message || 'An error occurred while fetching products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndProfile();
  }, [router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getDisplayUrl = (link: AffiliateLink) => {
    let url = link.trackingUrl;
    if (!url) return `https://${shopifyDomain}/discount/${link.discountCode}?redirect=/products/${selectedProduct?.handle}`;
    // Replace hardcoded localhost from old database entries
    if (url.includes('localhost:3001')) {
      return url.replace('http://localhost:3001', 'https://shop.creatorsxchange.com');
    }
    return url;
  };

  const filteredProducts = products.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products & Affiliate Links</h1>
          <p className="text-slate-600 mt-1">Manage your Shopify products and view generated influencer links.</p>
        </div>
        
        {!error && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white text-slate-900"
            />
          </div>
        )}
      </div>

      {error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-2">Store Not Connected</h3>
          <p className="text-amber-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard/store')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Connect Store Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              No products found matching "{searchQuery}"
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Package className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                  {product.price && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-xs font-bold px-2 py-1 rounded shadow-sm text-slate-800">
                      {product.price}
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-slate-800 line-clamp-2 mb-2">{product.title}</h3>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={`https://${shopifyDomain}/products/${product.handle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-medium"
                    >
                      <ExternalLink className="w-3 h-3" /> View in Store
                    </a>
                    
                    <button 
                      onClick={() => setSelectedProduct(product)}
                      className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" /> View Links
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal for Affiliate Links */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Affiliate Links</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedProduct.title}</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsAddingNew(!isAddingNew)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {isAddingNew ? 'Cancel' : 'Generate New Link'}
                </button>
                <button onClick={() => { setSelectedProduct(null); setIsAddingNew(false); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {isAddingNew && (
                <div className="mb-8 p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <h3 className="font-bold text-emerald-900 mb-4">Generate Manual Affiliate Link</h3>
                  {generateError && <p className="text-red-500 text-sm mb-3">{generateError}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 mb-1">Influencer Name</label>
                      <input type="text" value={newCreatorName} onChange={e => setNewCreatorName(e.target.value)} placeholder="e.g. John Doe" className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white text-emerald-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 mb-1">Discount Code</label>
                      <input type="text" value={newDiscountCode} onChange={e => setNewDiscountCode(e.target.value.toUpperCase())} placeholder="e.g. JOHN20" className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm uppercase bg-white text-emerald-900" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 mb-1">Commission %</label>
                      <input type="number" value={newCommission} onChange={e => setNewCommission(e.target.value)} min="1" max="100" className="w-full px-3 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white text-emerald-900" />
                    </div>
                  </div>
                  <button 
                    disabled={isGenerating || !newCreatorName || !newDiscountCode || !newCommission}
                    onClick={async () => {
                      setIsGenerating(true);
                      setGenerateError('');
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shopify/affiliates/generate-manual`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({
                            shopifyProductHandle: selectedProduct.handle,
                            productId: selectedProduct.id,
                            customCreatorName: newCreatorName,
                            discountCode: newDiscountCode,
                            commissionRate: Number(newCommission)
                          })
                        });
                        if (!res.ok) throw new Error(await res.text());
                        const newLink = await res.json();
                        setAffiliates(prev => [...prev, newLink]);
                        setIsAddingNew(false);
                        setNewCreatorName('');
                        setNewDiscountCode('');
                      } catch (err: any) {
                        setGenerateError('Failed to generate link. Check if code already exists.');
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate & Save on Shopify'}
                  </button>
                </div>
              )}

              {(() => {
                const productLinks = affiliates.filter(a => a.shopifyProductHandle === selectedProduct.handle);
                if (productLinks.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-500">
                      <LinkIcon className="w-12 h-12 opacity-20 mx-auto mb-3" />
                      <p>No active influencer links for this product yet.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {productLinks.map(link => (
                      <div key={link._id} className="border border-slate-200 rounded-xl p-4 hover:border-emerald-200 transition-colors bg-white">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                              {link.creatorId?.profileImage ? (
                                <img src={link.creatorId.profileImage} alt="Creator" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-slate-500">{(link.customCreatorName || link.creatorId?.name || 'C').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{link.customCreatorName || link.creatorId?.name || 'Unknown Creator'}</p>
                              <p className="text-xs text-slate-500">Code: <span className="font-bold text-slate-700">{link.discountCode}</span></p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{link.productSalesCount} Sales</p>
                            <p className="text-xs text-slate-500 mt-1">{link.clicks} Clicks</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4">
                          <input 
                            type="text" 
                            readOnly 
                            value={getDisplayUrl(link)}
                            className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none"
                          />
                          <button 
                            onClick={() => copyToClipboard(getDisplayUrl(link))}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            title="Copy link"
                          >
                            {copiedLink === getDisplayUrl(link) ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
