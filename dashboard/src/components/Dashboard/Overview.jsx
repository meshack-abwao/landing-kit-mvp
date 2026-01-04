import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, productsAPI, settingsAPI } from '../../services/api.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { TrendingUp, Package, ShoppingCart, DollarSign, ExternalLink, Eye, Calendar } from 'lucide-react';

const getStoreBaseUrl = () => {
  return window.location.hostname === 'localhost' ? 'http://localhost:5177' : 'https://jariecomstore.netlify.app';
};

const TIME_FILTERS = [
  { key: 'today', label: 'Today', days: 1 },
  { key: 'week', label: 'Week', days: 7 },
  { key: 'month', label: 'Month', days: 30 },
  { key: 'all', label: 'All', days: null },
];

export default function Overview() {
  const [allOrders, setAllOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeUrl, setStoreUrl] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    loadData();
    loadStoreUrl();
  }, []);

  const loadData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setAllOrders(ordersRes.data.orders || []);
      setProducts(productsRes.data.products || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStoreUrl = async () => {
    try {
      const response = await settingsAPI.getAll();
      const subdomain = response.data.settings?.subdomain;
      if (subdomain) setStoreUrl(`${getStoreBaseUrl()}?subdomain=${subdomain}`);
    } catch (error) {
      console.error('Failed to load store URL:', error);
    }
  };

  const getFilteredOrders = () => {
    const filter = TIME_FILTERS.find(f => f.key === timeFilter);
    if (!filter || !filter.days) return allOrders;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filter.days);
    return allOrders.filter(order => new Date(order.created_at) >= cutoffDate);
  };

  const filteredOrders = getFilteredOrders();
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const convertedRevenue = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const totalOrders = filteredOrders.length;
  const activeProducts = products.filter(p => p.is_active).length;

  const viewProduct = (productId) => storeUrl && window.open(`${storeUrl}&product=${productId}`, '_blank');
  const viewCollections = () => storeUrl && window.open(storeUrl, '_blank');

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '1400px' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '4px', color: 'var(--text-primary)' }}>Overview</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Your store performance at a glance</p>
        </div>
        {storeUrl && (
          <button onClick={viewCollections} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExternalLink size={18} /> View Store
          </button>
        )}
      </div>

      {/* Time Filter */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key)}
              className={`filter-btn ${timeFilter === filter.key ? 'active' : ''}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid - Masonry on Mobile */}
      <div className="stats-masonry" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)' }}><DollarSign size={24} /></div>
          <div>
            <p className="stat-label">Total Revenue</p>
            <p className="stat-value">KES {parseInt(totalRevenue).toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}><ShoppingCart size={24} /></div>
          <div>
            <p className="stat-label">Total Orders</p>
            <p className="stat-value">{totalOrders}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)' }}><Package size={24} /></div>
          <div>
            <p className="stat-label">Active Products</p>
            <p className="stat-value">{activeProducts}</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)' }}><TrendingUp size={24} /></div>
          <div>
            <p className="stat-label">Converted</p>
            <p className="stat-value">KES {parseInt(convertedRevenue).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          <div onClick={() => navigate('/dashboard/products')} className="action-card glass-card">
            <div className="action-icon">📦</div>
            <h3 className="action-title">Add Product</h3>
            <p className="action-desc">Create a new listing</p>
          </div>
          <div onClick={() => navigate('/dashboard/orders')} className="action-card glass-card">
            <div className="action-icon">📋</div>
            <h3 className="action-title">View Orders</h3>
            <p className="action-desc">Manage sales</p>
          </div>
          <div onClick={() => navigate('/dashboard/templates')} className="action-card glass-card">
            <div className="action-icon">🎨</div>
            <h3 className="action-title">Templates</h3>
            <p className="action-desc">Design your pages</p>
          </div>
        </div>
      </div>

      {/* Recent Products */}
      {products.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Recent Products</h2>
            {storeUrl && (
              <button onClick={viewCollections} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--accent-color)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                <Eye size={16} /> View All
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {products.slice(0, 3).map((product) => (
              <div key={product.id} className="product-card glass-card">
                <div className="product-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>📸</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">KES {parseInt(product.price).toLocaleString()}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: product.is_active ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: product.is_active ? '#22c55e' : '#ef4444' }}>
                      {product.is_active ? '● Live' : '● Draft'}
                    </span>
                    <button onClick={() => viewProduct(product.id)} style={{ padding: '6px 10px', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={14} /> View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
