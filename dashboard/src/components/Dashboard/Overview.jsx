import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, productsAPI, settingsAPI } from '../../services/api.jsx';
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

  // Filter orders by time period
  const getFilteredOrders = () => {
    const filter = TIME_FILTERS.find(f => f.key === timeFilter);
    if (!filter || !filter.days) return allOrders;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - filter.days);
    
    return allOrders.filter(order => new Date(order.created_at) >= cutoffDate);
  };

  const filteredOrders = getFilteredOrders();
  
  // Calculate stats from filtered orders
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
    return <div style={styles.loading}>Loading...</div>;
  }

  const statCards = [
    { title: 'Total Revenue', value: `KES ${parseInt(totalRevenue).toLocaleString()}`, icon: <DollarSign size={24} />, gradient: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)' },
    { title: 'Total Orders', value: totalOrders, icon: <ShoppingCart size={24} />, gradient: 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)' },
    { title: 'Active Products', value: products.filter(p => p.is_active).length, icon: <Package size={24} />, gradient: 'linear-gradient(135deg, #0a84ff 0%, #00d4ff 100%)' },
    { title: 'Converted Revenue', value: `KES ${parseInt(convertedRevenue).toLocaleString()}`, icon: <TrendingUp size={24} />, gradient: 'linear-gradient(135deg, #30d158 0%, #00c7be 100%)' },
  ];

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Overview</h1>
          <p style={styles.subtitle}>Let's review what's working!</p>
        </div>
        {storeUrl && (
          <button onClick={viewCollections} className="btn btn-primary" style={styles.viewStoreBtn}>
            <ExternalLink size={20} />
            <span>View Live Store</span>
          </button>
        )}
      </div>

      {/* Time Filter */}
      <div style={styles.filterSection}>
        <div style={styles.filterLabel}>
          <Calendar size={16} />
          <span>Filter by:</span>
        </div>
        <div style={styles.filterButtons}>
          {TIME_FILTERS.map(filter => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key)}
              style={{
                ...styles.filterBtn,
                ...(timeFilter === filter.key ? styles.filterBtnActive : {})
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.statsGrid}>
        {statCards.map((card, index) => (
          <div key={index} style={styles.statCard} className="glass-card">
            <div style={{ ...styles.statIcon, background: card.gradient }}>{card.icon}</div>
            <div>
              <p style={styles.statLabel}>{card.title}</p>
              <p style={styles.statValue}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          <div onClick={() => navigate('/dashboard/products')} style={styles.actionCard} className="glass-card">
            <div style={styles.actionIcon}>📦</div>
            <h3 style={styles.actionTitle}>Add Product</h3>
            <p style={styles.actionDesc}>Start selling a new product</p>
          </div>
          <div onClick={() => navigate('/dashboard/orders')} style={styles.actionCard} className="glass-card">
            <div style={styles.actionIcon}>📋</div>
            <h3 style={styles.actionTitle}>View Orders</h3>
            <p style={styles.actionDesc}>Manage your orders</p>
          </div>
          <div onClick={() => navigate('/dashboard/marketplace')} style={styles.actionCard} className="glass-card">
            <div style={styles.actionIcon}>⚡</div>
            <h3 style={styles.actionTitle}>Browse Add-Ons</h3>
            <p style={styles.actionDesc}>Explore powerful add-ons</p>
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Products</h2>
            {products.length > 1 && storeUrl && (
              <button onClick={viewCollections} style={styles.viewAllBtn}>
                <Eye size={18} />
                View Collections
              </button>
            )}
          </div>
          <div style={styles.productsList}>
            {products.slice(0, 3).map((product) => (
              <div key={product.id} style={styles.productCard} className="glass-card">
                <div style={styles.productImage}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={styles.productImg} />
                  ) : (
                    <div style={styles.productPlaceholder}>📸</div>
                  )}
                </div>
                <div style={styles.productInfo}>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.productPrice}>KES {parseInt(product.price).toLocaleString()}</p>
                  <div style={styles.productFooter}>
                    <span style={{ ...styles.productStatus, background: product.is_active ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 55, 95, 0.2)', color: product.is_active ? '#30d158' : '#ff375f' }}>
                      {product.is_active ? '● Active' : '● Inactive'}
                    </span>
                    <button onClick={() => viewProduct(product.id)} style={styles.viewProductBtn}>
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

const styles = {
  container: { maxWidth: '1400px' },
  loading: { textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.5)' },
  header: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '36px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' },
  viewStoreBtn: { display: 'flex', alignItems: 'center', gap: '8px' },
  filterSection: { marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
  filterLabel: { display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', fontWeight: '600' },
  filterButtons: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  filterBtnActive: { background: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)', border: '1px solid transparent', color: 'white' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' },
  statCard: { padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' },
  statIcon: { width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  statLabel: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  statValue: { fontSize: '28px', fontWeight: '800', color: 'white' },
  section: { marginBottom: '40px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  sectionTitle: { fontSize: '24px', fontWeight: '700' },
  viewAllBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'rgba(255, 159, 10, 0.1)', border: '1px solid rgba(255, 159, 10, 0.3)', borderRadius: '10px', color: '#ff9f0a', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  actionCard: { padding: '24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' },
  actionIcon: { fontSize: '40px', marginBottom: '12px' },
  actionTitle: { fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '8px' },
  actionDesc: { fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' },
  productsList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  productCard: { padding: '20px', display: 'flex', gap: '16px' },
  productImage: { width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 },
  productImg: { width: '100%', height: '100%', objectFit: 'cover' },
  productPlaceholder: { width: '100%', height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #bf5af2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' },
  productInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  productName: { fontSize: '16px', fontWeight: '700' },
  productPrice: { fontSize: '18px', fontWeight: '800', color: '#ff9f0a' },
  productFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  productStatus: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  viewProductBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' },
};
