import { useState, useEffect } from 'react';
import { ordersAPI } from '../../services/api.jsx';
import { Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export default function OrdersTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await ordersAPI.getAll();
      setOrders(data.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      await loadOrders();
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: 'rgba(255, 159, 10, 0.2)', text: '#ff9f0a', icon: <Clock size={14} /> };
      case 'paid': return { bg: 'rgba(10, 132, 255, 0.2)', text: '#0a84ff', icon: <DollarSign size={14} /> };
      case 'delivered': return { bg: 'rgba(48, 209, 88, 0.2)', text: '#30d158', icon: <CheckCircle size={14} /> };
      case 'cancelled': return { bg: 'rgba(255, 55, 95, 0.2)', text: '#ff375f', icon: <XCircle size={14} /> };
      default: return { bg: 'rgba(255, 255, 255, 0.1)', text: '#fff', icon: null };
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading orders...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Orders</h1>
          <p style={styles.subtitle}>Manage and track your orders</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={styles.empty} className="glass-card">
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>No orders yet</h3>
          <p style={styles.emptyText}>Orders will appear here when customers make purchases</p>
        </div>
      ) : (
        <div style={styles.tableContainer} className="glass-card">
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Location</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Payment</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
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
                    <td style={styles.td}>{order.customer_phone}</td>
                    <td style={styles.td}>{order.customer_location}</td>
                    <td style={styles.td}>{order.quantity}</td>
                    <td style={styles.td}>
                      <span style={styles.price}>KES {parseInt(order.total_amount).toLocaleString()}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.payment}>{order.payment_method.toUpperCase()}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                      }}>
                        {statusStyle.icon}
                        {order.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={styles.td}>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        style={styles.statusSelect}
                      >
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
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '100%',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  empty: {
    padding: '80px 40px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  tableContainer: {
    padding: '0',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },
  tableRow: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'background 0.2s',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)',
    whiteSpace: 'nowrap',
  },
  orderId: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#ff9f0a',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productThumb: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  price: {
    fontWeight: '700',
    color: '#ff9f0a',
  },
  payment: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusSelect: {
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer',
  },
};
