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
  { key: 'week', label: 'This Week', days: 7 },
  { key: 'month', label: 'This Month', days: 30 },
  { key: 'quarter', label: 'Quarter', days: 90 },
  { key: '6months', label: '6 Months', days: 180 },
  { key: 'year', label: '1 Year', days: 365 },
  { key: 'all', label: 'All Time', days: null },
];

export default function Overview() {
  const [allOrders, setAllOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeUrl, setStoreUrl] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  // Theme-aware colors
  const isDark = theme === 'dark';
  const colors = {
    textPrimary: isDark ? '#ffffff' : '#0f172a',
    textSecondary: isDark ? 'rgba(255, 255, 255, 0.7)' : '#334155',
    textMuted: isDark ? 'rgba(255, 255, 255, 0.5)' : '#64748b',
    accent: isDark ? '#D4A84B' : '#2563eb',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(37, 99, 235, 0.15)',
    cardBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.9)',
  };

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
      if (subdomain) {
        setStoreUrl(`${getStoreBaseUrl()}?subdomain=${subdomain}`);
      }
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
  const convertedRevenue = filteredOrders
    .filter(o => o.status === 'completed' || o.status === 'delivered')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
  const totalOrders = filteredOrders.length;

  const viewProduct = (productId) => {
    if (storeUrl) window.open(`${storeUrl}&product=${productId}`, '_blank');
  };

  const viewCollections = () => {
    if (storeUrl) window.open(storeUrl, '_blank');
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: colors.textMuted }}>Loading...</div>;
  }

  const statCards = [
    { title: 'Total Revenue', value: `KES ${parseInt(totalRevenue).toLocaleString()}`, icon: <DollarSign size={24} />, gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)' },
    { title: 'Total Orders', value: totalOrders, icon: <ShoppingCart size={24} />, gradient: 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)' },
    { title: 'Active Products', value: products.filter(p => p.is_active).length, icon: <Package size={24} />, gradient: 'linear-gradient(135deg, #0a84ff 0%, #00d4ff 100%)' },
    { title: 'Converted Revenue', value: `KES ${parseInt(convertedRevenue).toLocaleString()}`, icon: <TrendingUp size={24} />, gradient: 'linear-gradient(135deg, #30d158 0%, #00c7be 100%)' },
  ];

  return (
    <div style={{ maxWidth: '1400px' }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: colors.textPrimary }}>Overview</h1>
          <p style={{ fontSize: '16px', color: colors.textMuted }}>Let's review what's working!</p>
        </div>
        {storeUrl && (
          <button onClick={viewCollections} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExternalLink size={20} />
            <span>View Live Store</span>
          </button>
        )}
      </div>

      {/* Time Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.textMuted, fontSize: '14px', fontWeight: '600' }}>
          <Calendar size={16} />
          <span>Filter by:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: timeFilter === filter.key ? '1px solid transparent' : `1px solid ${colors.border}`,
                background: timeFilter === filter.key 
                  ? (isDark ? 'linear-gradient(135deg, #D4A84B 0%, #E07B39 100%)' : 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)')
                  : colors.cardBg,
                color: timeFilter === filter.key ? 'white' : colors.textSecondary,
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {statCards.map((card, index) => (
          <div key={index} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }} className="glass-card">
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: card.gradient }}>
              {card.icon}
            </div>
            <div>
              <p style={{ fontSize: '13px', color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{card.title}</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: colors.textPrimary }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px', color: colors.textPrimary }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div onClick={() => navigate('/dashboard/products')} style={{ padding: '24px', textAlign: 'center', cursor: 'pointer' }} className="glass-card">
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>Add Product</h3>
            <p style={{ fontSize: '13px', color: colors.textMuted }}>Start selling a new product</p>
          </div>
          <div onClick={() => navigate('/dashboard/orders')} style={{ padding: '24px', textAlign: 'center', cursor: 'pointer' }} className="glass-card">
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>View Orders</h3>
            <p style={{ fontSize: '13px', color: colors.textMuted }}>Manage your orders</p>
          </div>
          <div onClick={() => navigate('/dashboard/marketplace')} style={{ padding: '24px', textAlign: 'center', cursor: 'pointer' }} className="glass-card">
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚡</div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>Browse Add-Ons</h3>
            <p style={{ fontSize: '13px', color: colors.textMuted }}>Explore powerful add-ons</p>
          </div>
        </div>
      </div>

      {/* Recent Products */}
      {products.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary }}>Recent Products</h2>
            {products.length > 1 && storeUrl && (
              <button onClick={viewCollections} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                background: isDark ? 'rgba(212, 168, 75, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                border: `1px solid ${isDark ? 'rgba(212, 168, 75, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
                borderRadius: '10px', color: colors.accent, fontSize: '14px', fontWeight: '600', cursor: 'pointer'
              }}>
                <Eye size={18} />
                View Collections
              </button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {products.slice(0, 3).map((product) => (
              <div key={product.id} style={{ padding: '20px', display: 'flex', gap: '16px' }} className="glass-card">
                <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>📸</div>
                  )}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary }}>{product.name}</h3>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: colors.accent }}>KES {parseInt(product.price).toLocaleString()}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      background: product.is_active ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 55, 95, 0.2)',
                      color: product.is_active ? '#30d158' : '#ff375f'
                    }}>
                      {product.is_active ? '● Active' : '● Inactive'}
                    </span>
                    <button onClick={() => viewProduct(product.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                      background: colors.cardBg, border: `1px solid ${colors.border}`,
                      borderRadius: '8px', color: colors.textSecondary, fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                    }}>
                      <Eye size={16} /> View
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
