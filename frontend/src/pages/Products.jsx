import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, X, Package } from 'lucide-react'
import { productsApi } from '../api/products'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', sku: '', category: 'General', price: '', stock_quantity: '' }

function ProductModal({ product, onClose, onSave }) {
  const [form, setForm] = useState(product ? {
    name: product.name,
    sku: product.sku,
    category: product.category || 'General',
    price: product.price,
    stock_quantity: product.stock_quantity,
  } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.price || Number(form.price) <= 0) e.price = 'Price must be greater than 0'
    if (form.stock_quantity === '' || Number(form.stock_quantity) < 0) e.stock_quantity = 'Stock must be 0 or more'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
      }
      if (product) {
        await productsApi.update(product.id, payload)
        toast.success('Product updated')
      } else {
        await productsApi.create(payload)
        toast.success('Product created')
      }
      onSave()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Product Name</label>
            <input className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Wireless Mouse" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">SKU</label>
            <input className="input font-mono" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="e.g. WM-001" />
            {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="General">General</option>
              <option value="Mouse">Mouse</option>
              <option value="Keyboard">Keyboard</option>
              <option value="Monitor">Monitor</option>
              <option value="Cable">Cable</option>
              <option value="Headphone">Headphone</option>
              <option value="Storage">Storage</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price ($)</label>
              <input className="input" type="number" min="0.01" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="0.00" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="label">Stock Qty</label>
              <input className="input" type="number" min="0" value={form.stock_quantity} onChange={e => setForm({...form, stock_quantity: e.target.value})} placeholder="0" />
              {errors.stock_quantity && <p className="text-xs text-red-500 mt-1">{errors.stock_quantity}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : product ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StockBadge({ qty }) {
  if (qty === 0) return <span className="badge-red">Out of stock</span>
  if (qty <= 10) return <span className="badge-yellow">{qty} left</span>
  return <span className="badge-green">{qty} in stock</span>
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | product object

  async function load() {
    setLoading(true)
    try {
      const res = await productsApi.getAll({ search: search || undefined })
      setProducts(res.data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

  async function handleDelete(product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    try {
      await productsApi.delete(product.id)
      toast.success('Product deleted')
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Products</h2>
          <p className="text-sm text-gray-400">{products.length} products total</p>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="input pl-9"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="card/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">SKU</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Price</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Stock</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Added</th>
                <th className="text-right text-xs font-semibold text-gray-400 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i}>
                    {Array.from({length: 6}).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-gray-400">No products found</p>
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="hover:card/5 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-white">{p.name}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{p.sku}</td>
                    <td className="px-4 py-3 text-sm text-gray-200">${p.price.toFixed(2)}</td>
                    <td className="px-4 py-3"><StockBadge qty={p.stock_quantity} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setModal(p)}
                          className="p-1.5 rounded-md hover:bg-brand-50 text-gray-500 hover:text-brand-600 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <ProductModal
          product={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}
