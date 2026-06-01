import { useEffect, useState } from 'react'
import { Plus, X, ShoppingCart, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { ordersApi } from '../api/orders'
import { productsApi } from '../api/products'
import { customersApi } from '../api/customers'
import toast from 'react-hot-toast'

function CreateOrderModal({ onClose, onSave }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    Promise.all([customersApi.getAll(), productsApi.getAll()])
      .then(([c, p]) => {
        setCustomers(c.data)
        setProducts(p.data)
      })
      .catch(err => toast.error(err.message))
  }, [])

  function addItem() {
    setItems([...items, { product_id: '', quantity: 1 }])
  }

  function removeItem(i) {
    setItems(items.filter((_, idx) => idx !== i))
  }

  function updateItem(i, field, value) {
    const updated = [...items]
    updated[i] = { ...updated[i], [field]: value }
    setItems(updated)
  }

  function getProduct(id) {
    return products.find(p => p.id === Number(id))
  }

  function calculateTotal() {
    return items.reduce((sum, item) => {
      const p = getProduct(item.product_id)
      return sum + (p ? p.price * (Number(item.quantity) || 0) : 0)
    }, 0)
  }

  function validate() {
    const e = {}
    if (!customerId) e.customer = 'Please select a customer'
    if (items.length === 0) e.items = 'Add at least one item'
    items.forEach((item, i) => {
      if (!item.product_id) e[`item_${i}_product`] = 'Select a product'
      if (!item.quantity || Number(item.quantity) < 1) e[`item_${i}_qty`] = 'Min qty is 1'
    })
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await ordersApi.create({
        customer_id: Number(customerId),
        items: items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }))
      })
      toast.success('Order created successfully')
      onSave()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Create New Order</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Customer */}
          <div>
            <label className="label">Customer</label>
            <select
              className="input"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
            >
              <option value="">Select a customer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
              ))}
            </select>
            {errors.customer && <p className="text-xs text-red-500 mt-1">{errors.customer}</p>}
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Order Items</label>
              <button type="button" onClick={addItem} className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <Plus size={12} /> Add item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => {
                const product = getProduct(item.product_id)
                return (
                  <div key={i} className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <select
                          className="input text-sm"
                          value={item.product_id}
                          onChange={e => updateItem(i, 'product_id', e.target.value)}
                        >
                          <option value="">Select product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id} disabled={p.stock_quantity === 0}>
                              {p.name} — ${p.price.toFixed(2)} ({p.stock_quantity} in stock)
                            </option>
                          ))}
                        </select>
                        {errors[`item_${i}_product`] && <p className="text-xs text-red-500 mt-1">{errors[`item_${i}_product`]}</p>}
                      </div>
                      <div className="w-24">
                        <input
                          className="input text-sm"
                          type="number"
                          min="1"
                          max={product?.stock_quantity || 9999}
                          value={item.quantity}
                          onChange={e => updateItem(i, 'quantity', e.target.value)}
                          placeholder="Qty"
                        />
                        {errors[`item_${i}_qty`] && <p className="text-xs text-red-500 mt-1">{errors[`item_${i}_qty`]}</p>}
                      </div>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="p-2 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {product && (
                      <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>Unit: ${product.price.toFixed(2)}</span>
                        <span className="font-medium">Subtotal: ${(product.price * (Number(item.quantity) || 0)).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-brand-50 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-200">Order Total</span>
            <span className="text-xl font-bold text-brand-700">${calculateTotal().toFixed(2)}</span>
          </div>
        </form>
        <div className="px-6 py-4 border-t border-white/5 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderRow({ order }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <tr
        className="hover:bg-white/5 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3 text-sm font-mono font-medium text-slate-800">
          #{order.id.toString().padStart(4, '0')}
        </td>
        <td className="px-4 py-3 text-sm text-gray-300">
          Customer #{order.customer_id}
        </td>
        <td className="px-4 py-3 text-sm font-medium text-white">
          ${order.total_amount.toFixed(2)}
        </td>
        <td className="px-4 py-3">
          <span className="badge-blue">{order.items?.length || 0} items</span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          {new Date(order.created_at).toLocaleDateString()}
        </td>
        <td className="px-4 py-3 text-right">
          {expanded ? <ChevronUp size={14} className="ml-auto text-gray-500" /> : <ChevronDown size={14} className="ml-auto text-gray-500" />}
        </td>
      </tr>
      {expanded && order.items && order.items.length > 0 && (
        <tr className="bg-white/5">
          <td colSpan={6} className="px-4 py-3">
            <div className="ml-4 space-y-1">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center gap-4 text-xs text-gray-300">
                  <span className="font-mono text-gray-500">Product #{item.product_id}</span>
                  <span>× {item.quantity}</span>
                  <span>@ ${item.price.toFixed(2)}</span>
                  <span className="font-medium text-slate-800">= ${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await ordersApi.getAll()
      setOrders(res.data.reverse())
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Orders</h2>
          <p className="text-sm text-gray-400">{orders.length} orders total</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> New Order
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Order ID</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Items</th>
                <th className="text-left text-xs font-semibold text-gray-400 px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <ShoppingCart size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-gray-400">No orders yet. Create your first order!</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => <OrderRow key={order.id} order={order} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <CreateOrderModal
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
