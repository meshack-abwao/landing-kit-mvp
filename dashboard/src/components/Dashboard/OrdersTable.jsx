import { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api.jsx';
import { Clock, CheckCircle, XCircle, DollarSign, Filter, Download, Phone, MapPin, RefreshCw, TrendingUp, Package, Truck } from 'lucide-react';

export default function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, revenue: 0 });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filter, searchTerm]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await ordersAPI.getAll();
      const ordersList = data.orders || [];
      setOrders(ordersList);
      calculateStats(ordersList);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    const total = ordersList.length;
    const pending = ordersList.filter(o => o.status === 'pending').length;
    const completed = ordersList.filter(o => ['completed', 'delivered', 'paid'].includes(o.status)).length;
    const revenue = ordersList
      .filter(o => ['completed', 'delivered'].includes(o.status))
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    setStats({ total, pending, completed, revenue });
  };

  const filterOrders = () => {
    let filtered = [...orders];
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(o => o.status === filter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.customer_name?.toLowerCase().includes(term) ||
        o.customer_phone?.includes(term) ||
        o.order_number?.toLowerCase().includes(term) ||
        o.product_name?.toLowerCase().includes(term)
      );
    }
    
    setFilteredOrders(filtered);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      await loadOrders();
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Product', 'Customer', 'Phone', 'Location', 'Qty', 'Total', 'Payment', 'Status', 'Date'].join(','),
      ...filteredOrders.map(o => [
        o.order_number,
        `"${o.product_name}"`,
        `"${o.customer_name}"`,
        o.customer_phone,
        `"${o.customer_location}"`,
        o.quantity,
        o.total_amount,
        o.payment_method,
        o.status,
        new Date(o.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: 'rgba(255, 159, 10, 0.2)', text: '#ff9f0a', icon: <Clock size={14} /> };
      case 'paid': return { bg: 'rgba(10, 132, 255, 0.2)', text: '#0a84ff', icon: <DollarSign size={14} /> };
      case 'completed':
      case 'delivered': return { bg: 'rgba(48, 209, 88, 0.2)', text: '#30d158', icon: <CheckCircle size={14} /> };
      case 'cancelled': return { bg: 'rgba(255, 55, 95, 0.2)', text: '#ff375f', icon: <XCircle size={14} /> };
      default: return { bg: 'rgba(255, 255, 255, 0.1)', text: '#fff', icon: null };
    }
  };

  const callCustomer = (phone) => {
    window.open(`tel:${phone}`, '_self');
  };

  const openMaps = (location) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(location)}`, '_blank');
  };


  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Orders</h1>
          <p style={styles.subtitle}>Manage and track your orders</p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={loadOrders} style={styles.refreshBtn} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button onClick={exportOrders} style={styles.exportBtn}>
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard} className="glass-card">
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <Package size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Total Orders</p>
            <p style={styles.statValue}>{stats.total}</p>
          </div>
        </div>
        <div style={styles.statCard} className="glass-card">
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #ff9f0a 0%, #ff375f 100%)'}}>
            <Clock size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Pending</p>
            <p style={styles.statValue}>{stats.pending}</p>
          </div>
        </div>
        <div style={styles.statCard} className="glass-card">
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #30d158 0%, #00c7be 100%)'}}>
            <Truck size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Completed</p>
            <p style={styles.statValue}>{stats.completed}</p>
          </div>
        </div>
        <div style={styles.statCard} className="glass-card">
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #0a84ff 0%, #00d4ff 100%)'}}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Revenue</p>
            <p style={styles.statValue}>KES {stats.revenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersRow} className="glass-card">
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by name, phone, order #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            className="dashboard-input"
          />
        </div>
        <div style={styles.filterTabs}>
          {['all', 'pending', 'paid', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                ...styles.filterTab,
                ...(filter === status ? styles.filterTabActive : {})
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span style={styles.filterCount}>
                  {orders.filter(o => o.status === status).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>


      {filteredOrders.length === 0 ? (
        <div style={styles.empty} className="glass-card">
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>
            {orders.length === 0 ? 'No orders yet' : 'No matching orders'}
          </h3>
          <p style={styles.emptyText}>
            {orders.length === 0 
              ? 'Orders will appear here when customers make purchases'
              : 'Try adjusting your search or filter'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div style={styles.mobileCards}>
            {filteredOrders.map((order) => {
              const statusStyle = getStatusColor(order.status);
              return (
                <div key={order.id} style={styles.orderCard} className="glass-card">
                  <div style={styles.orderCardHeader}>
                    <span style={styles.orderId}>{order.order_number}</span>
                    <span style={{
                      ...styles.statusBadge,
                      background: statusStyle.bg,
                      color: statusStyle.text,
                    }}>
                      {statusStyle.icon}
                      {order.status}
                    </span>
                  </div>
                  
                  <div style={styles.orderCardBody}>
                    <div style={styles.orderProduct}>
                      {order.product_image && (
                        <img src={order.product_image} alt="" style={styles.productThumbMobile} />
                      )}
                      <div>
                        <p style={styles.productNameMobile}>{order.product_name}</p>
                        <p style={styles.orderQty}>Qty: {order.quantity}</p>
                      </div>
                    </div>
                    
                    <div style={styles.orderCustomer}>
                      <p style={styles.customerName}>{order.customer_name}</p>
                      <div style={styles.customerActions}>
                        <button onClick={() => callCustomer(order.customer_phone)} style={styles.actionBtn}>
                          <Phone size={16} /> {order.customer_phone}
                        </button>
                        <button onClick={() => openMaps(order.customer_location)} style={styles.actionBtn}>
                          <MapPin size={16} /> {order.customer_location}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={styles.orderCardFooter}>
                    <div>
                      <span style={styles.orderTotal}>KES {parseInt(order.total_amount).toLocaleString()}</span>
                      <span style={styles.orderDate}>
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      style={styles.statusSelectMobile}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div style={styles.tableContainer} className="glass-card">
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Order ID</th>
                  <th style={styles.th}>Product</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const statusStyle = getStatusColor(order.status);
                  return (
                    <tr key={order.id} style={styles.tableRow}>
                      <td style={styles.td}>
                        <span style={styles.orderId}>{order.order_number}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.productCell}>
                          {order.product_image && (
                            <img src={order.product_image} alt="" style={styles.productThumb} />
                          )}
                          <span>{order.product_name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{order.customer_name}</td>
                      <td style={styles.td}>
                        <div style={styles.contactCell}>
                          <button onClick={() => callCustomer(order.customer_phone)} style={styles.contactBtn} title="Call">
                            <Phone size={14} />
                          </button>
                          <button onClick={() => openMaps(order.customer_location)} style={styles.contactBtn} title="Map">
                            <MapPin size={14} />
                          </button>
                        </div>
                      </td>
                      <td style={styles.td}>{order.quantity}</td>
                      <td style={styles.td}>
                        <span style={styles.price}>KES {parseInt(order.total_amount).toLocaleString()}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.payment}>{(order.payment_method || 'N/A').toUpperCase()}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.statusBadge, background: statusStyle.bg, color: statusStyle.text}}>
                          {statusStyle.icon}
                          {order.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={styles.td}>
                        <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)} style={styles.statusSelect}>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


const styles = {
  container: { maxWidth: '100%' },
  loadingContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '16px', color: 'rgba(255,255,255,0.5)' },
  spinner: { width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #ff9f0a', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' },
  title: { fontSize: '36px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' },
  headerActions: { display: 'flex', gap: '12px' },
  refreshBtn: { padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.3)', borderRadius: '10px', color: '#ff9f0a', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: { padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' },
  statLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' },
  statValue: { fontSize: '24px', fontWeight: '800' },
  filtersRow: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', marginBottom: '24px' },
  searchBox: { width: '100%' },
  searchInput: { width: '100%', padding: '12px 16px' },
  filterTabs: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterTab: { padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  filterTabActive: { background: 'rgba(255,159,10,0.2)', borderColor: 'rgba(255,159,10,0.4)', color: '#ff9f0a' },
  filterCount: { background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px' },
  empty: { padding: '80px 40px', textAlign: 'center' },
  emptyIcon: { fontSize: '64px', marginBottom: '20px' },
  emptyTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '8px' },
  emptyText: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' },
  mobileCards: { display: 'none' },
  orderCard: { padding: '20px', marginBottom: '16px' },
  orderCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  orderCardBody: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' },
  orderProduct: { display: 'flex', gap: '12px', alignItems: 'center' },
  productThumbMobile: { width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' },
  productNameMobile: { fontWeight: '600', marginBottom: '4px' },
  orderQty: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' },
  orderCustomer: {},
  customerName: { fontWeight: '600', marginBottom: '8px' },
  customerActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' },
  orderCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  orderTotal: { fontSize: '20px', fontWeight: '700', color: '#ff9f0a', display: 'block' },
  orderDate: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
  statusSelectMobile: { padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '14px' },
  tableContainer: { padding: '0', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  tableHeader: { borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
  th: { padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' },
  tableRow: { borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s' },
  td: { padding: '16px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'nowrap' },
  orderId: { fontFamily: 'monospace', fontSize: '13px', color: '#ff9f0a' },
  productCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  productThumb: { width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' },
  contactCell: { display: 'flex', gap: '8px' },
  contactBtn: { padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' },
  price: { fontWeight: '700', color: '#ff9f0a' },
  payment: { fontSize: '12px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  statusSelect: { padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white', fontSize: '13px', cursor: 'pointer' },
};

// Add responsive styles via CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @media (max-width: 900px) {
    .orders-mobile-cards { display: block !important; }
    .orders-table-container { display: none !important; }
  }
`;
if (!document.querySelector('#orders-responsive-styles')) {
  styleSheet.id = 'orders-responsive-styles';
  document.head.appendChild(styleSheet);
}
