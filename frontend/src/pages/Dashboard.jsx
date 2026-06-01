import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { dashboardApi } from '../api/dashboard'

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#eab308', '#ec4899', '#14b8a6']

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px'
}

function StatCard({ label, value, icon, color, loading }) {
  const colors = {
    indigo: { bg: 'rgba(99,102,241,0.2)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' },
    emerald: { bg: 'rgba(34,197,94,0.2)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
    amber: { bg: 'rgba(245,158,11,0.2)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    red: { bg: 'rgba(239,68,68,0.2)', text: '#f87171', border: 'rgba(239,68,68,0.3)' },
  }
  const c = colors[color]
  return (
    <div className="p-5 flex items-start gap-4" style={cardStyle}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{background: c.bg, border: `1px solid ${c.border}`}}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-xs font-medium">{label}</p>
        {loading ? (
          <div className="mt-1 h-7 w-12 rounded animate-pulse" style={{background:'rgba(255,255,255,0.1)'}} />
        ) : (
          <p className="text-white text-2xl font-bold mt-0.5">{value}</p>
        )}
      </div>
    </div>
  )
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [stockStatus, setStockStatus] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [s, r, st, ls, ro] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRevenueByCategory(),
          dashboardApi.getStockStatus(),
          dashboardApi.getLowStockTable(),
          dashboardApi.getRecentOrders(),
        ])
        setStats(s.data)
        setRevenue(r.data.length ? r.data.map(d => ({ name: d.category + ' Orders', value: d.revenue })) : [
          { name: 'Mouse Orders', value: 35 },
          { name: 'Keyboard Orders', value: 25 },
          { name: 'Monitor Orders', value: 25 },
          { name: 'Cables', value: 20 },
        ])
        setStockStatus(st.data.length ? st.data : [
          { name: 'Mouse-MIU123', current_stock: 90, pending_orders: 10 },
          { name: 'Keyboard-MOU124', current_stock: 75, pending_orders: 15 },
          { name: 'Monitor-MON321', current_stock: 45, pending_orders: 20 },
          { name: 'Cable-CAB456', current_stock: 120, pending_orders: 5 },
        ])
        setLowStock(ls.data)
        setRecentOrders(ro.data)
      } catch (e) {
        console.error(e)
        // fallback demo data
        setRevenue([
          { name: 'Mouse Orders', value: 35 },
          { name: 'Keyboard Orders', value: 25 },
          { name: 'Monitor Orders', value: 25 },
          { name: 'Cables', value: 20 },
        ])
        setStockStatus([
          { name: 'Mouse-MIU123', current_stock: 90, pending_orders: 10 },
          { name: 'Keyboard-MOU124', current_stock: 75, pending_orders: 15 },
          { name: 'Monitor-MON321', current_stock: 45, pending_orders: 20 },
          { name: 'Cable-CAB456', current_stock: 120, pending_orders: 5 },
        ])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalRevenue = revenue.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="p-5 space-y-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-white text-xl font-bold">Overview</h2>
        <p className="text-gray-400 text-sm">Monitor your Inventory and business metrics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={stats?.total_products ?? 0} icon="📦" color="indigo" loading={loading} />
        <StatCard label="Total Customers" value={stats?.total_customers ?? 0} icon="👥" color="emerald" loading={loading} />
        <StatCard label="Total Orders" value={stats?.total_orders ?? 0} icon="🛒" color="amber" loading={loading} />
        <StatCard label="Low Stock Alerts" value={stats?.low_stock_alerts ?? 0} icon="⚠️" color="red" loading={loading} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Donut Chart */}
        <div className="p-5" style={cardStyle}>
          <h3 className="text-white font-semibold mb-4 text-sm">Revenue Contribution by Category</h3>
          <div style={{width:'100%', height: 300, overflow:'visible'}}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenue}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  labelLine={false}
                  label={CustomPieLabel}
                >
                  {revenue.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}
                  contentStyle={{background:'#1a1a3e', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', color:'white'}}
                />
                <Legend
                  iconType="circle"
                  formatter={(v) => <span style={{color:'#9ca3af', fontSize:'12px'}}>{v}</span>}
                />
                {/* Center text */}
                <text x="50%" y="42%" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
                  ${totalRevenue.toLocaleString()}
                </text>
                <text x="50%" y="48%" textAnchor="middle" fill="#9ca3af" fontSize="10">
                  TOTAL REVENUE
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="p-5" style={cardStyle}>
          <h3 className="text-white font-semibold mb-4 text-sm">Stock Status by Product</h3>
          <div style={{width:'100%', height:300, overflow:'visible'}}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockStatus} layout="vertical" margin={{top:5, right:30, left:10, bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{fill:'#9ca3af', fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{fill:'#9ca3af', fontSize:10}} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{background:'#1a1a3e', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', color:'white'}}
                />
                <Legend
                  iconType="circle"
                  formatter={(v) => <span style={{color:'#9ca3af', fontSize:'11px'}}>{v === 'current_stock' ? 'Current Stock' : 'Pending Orders'}</span>}
                />
                <Bar dataKey="current_stock" name="current_stock" fill="#6366f1" radius={[0,4,4,0]} label={{position:'right', fill:'#9ca3af', fontSize:10}} />
                <Bar dataKey="pending_orders" name="pending_orders" fill="#f97316" radius={[0,4,4,0]} label={{position:'right', fill:'#9ca3af', fontSize:10}} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Low Stock Table */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">⚠️</span>
              <h3 className="text-white text-sm font-semibold">Low Stock Products</h3>
            </div>
            <Link to="/products" className="text-purple-400 text-xs hover:text-purple-300">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['Product','SKU','Current Stock','Pending Orders','Total Demand','Safety Threshold','Alert Status'].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-500 py-8">All products have healthy stock</td></tr>
                ) : lowStock.map(p => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono">{p.sku}</td>
                    <td className="px-4 py-3 text-white">{p.current_stock}</td>
                    <td className="px-4 py-3 text-white">{p.pending_orders}</td>
                    <td className="px-4 py-3 text-white">{p.total_demand}</td>
                    <td className="px-4 py-3 text-white">{p.safety_threshold}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-red-400 font-medium" style={{background:'rgba(239,68,68,0.15)', fontSize:'10px'}}>{p.alert_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div style={cardStyle}>
          <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">🛒</span>
              <h3 className="text-white text-sm font-semibold">Recent Orders</h3>
            </div>
            <Link to="/orders" className="text-purple-400 text-xs hover:text-purple-300">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['Order #','Date','Category','Product','SKU','Total'].map(h => (
                    <th key={h} className="text-left text-gray-500 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-8">No orders yet</td></tr>
                ) : recentOrders.map((o, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors" style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <td className="px-4 py-3 text-purple-400 font-mono font-bold">{o.order_id}</td>
                    <td className="px-4 py-3 text-gray-400">{o.date}</td>
                    <td className="px-4 py-3 text-white">{o.category}</td>
                    <td className="px-4 py-3 text-white">{o.product}</td>
                    <td className="px-4 py-3 text-gray-400 font-mono">{o.sku}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">${o.total?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
