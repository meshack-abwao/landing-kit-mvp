import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, ArrowRight, Users, UtensilsCrossed, Calendar, Shield, Grid3X3 } from 'lucide-react';

export default function TemplateShowcase() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateIcon = (slug) => {
    const icons = {
      'quick-decision': <Zap size={32} />,
      'portfolio-booking': <Users size={32} />,
      'visual-menu': <UtensilsCrossed size={32} />,
      'event-landing': <Calendar size={32} />,
      'deep-dive': <Shield size={32} />,
      'catalog-nav': <Grid3X3 size={32} />
    };
    return icons[slug] || <Zap size={32} />;
  };

  const getTemplateColor = (slug) => {
    const colors = {
      'quick-decision': '#ff9f0a',
      'portfolio-booking': '#bf5af2',
      'visual-menu': '#ff375f',
      'event-landing': '#0a84ff',
      'deep-dive': '#30d158',
      'catalog-nav': '#ff9f0a'
    };
    return colors[slug] || '#ff9f0a';
  };

  const handleUseTemplate = (template) => {
    navigate('/dashboard/products', { 
      state: { 
        createNew: true, 
        templateType: template.slug 
      } 
    });
  };

  if (loading) {
    return <div style={styles.loading}>Loading templates...</div>;
  }

  return (
    <div style={styles.container} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Template Library</h1>
          <p style={styles.subtitle}>Choose the right template for your job-to-be-done</p>
        </div>
      </div>

      {/* JTBD Intro */}
      <div style={styles.introCard} className="glass-card">
        <div style={styles.introIcon}>🎯</div>
        <div style={styles.introContent}>
          <h2 style={styles.introTitle}>Every template solves a specific job</h2>
          <p style={styles.introText}>
            We've designed each template around a core customer job. Pick the one that matches 
            what your customers are trying to accomplish, not just how it looks.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div style={styles.grid}>
        {templates.map((template) => {
          const color = getTemplateColor(template.slug);
          const isSelected = selectedTemplate?.slug === template.slug;
          
          return (
            <div 
              key={template.id} 
              style={{
                ...styles.card,
                borderColor: isSelected ? color : 'rgba(255, 255, 255, 0.1)',
                borderWidth: isSelected ? '2px' : '1px',
              }} 
              className="glass-card"
              onClick={() => setSelectedTemplate(isSelected ? null : template)}
            >
              {/* Header */}
              <div style={styles.cardHeader}>
                <div style={{
                  ...styles.iconWrapper,
                  background: `${color}20`,
                  color: color
                }}>
                  {getTemplateIcon(template.slug)}
                </div>
                <div style={styles.priceTag}>
                  KES {parseInt(template.price).toLocaleString()}
                </div>
              </div>

              {/* Title & Job Statement */}
              <h3 style={styles.cardTitle}>{template.name}</h3>
              <p style={styles.jobStatement}>"{template.job_statement}"</p>
              
              {/* Best For */}
              <div style={styles.bestFor}>
                <span style={styles.bestForLabel}>Best for:</span>
                <span style={styles.bestForValue}>{template.best_for}</span>
              </div>

              {/* Expanded Content */}
              {isSelected && (
                <div style={styles.expandedContent}>
                  {/* Key Outcomes */}
                  <div style={styles.outcomesSection}>
                    <h4 style={styles.outcomesTitle}>Key Outcomes:</h4>
                    <ul style={styles.outcomesList}>
                      {template.key_outcomes?.map((outcome, idx) => (
                        <li key={idx} style={styles.outcomeItem}>
                          <Check size={16} style={{ color: '#30d158', flexShrink: 0 }} />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Industries */}
                  <div style={styles.industriesSection}>
                    <h4 style={styles.industriesTitle}>Industries:</h4>
                    <div style={styles.industriesTags}>
                      {template.industries?.map((industry, idx) => (
                        <span key={idx} style={styles.industryTag}>{industry}</span>
                      ))}
                    </div>
                  </div>

                  {/* Use This Template Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseTemplate(template);
                    }}
                    style={{
                      ...styles.useBtn,
                      background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
                    }}
                  >
                    Use This Template
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}

              {/* Click to expand hint */}
              {!isSelected && (
                <p style={styles.expandHint}>Click to see details</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Help Section */}
      <div style={styles.helpSection} className="glass-card">
        <h3 style={styles.helpTitle}>Not sure which template to pick?</h3>
        <p style={styles.helpText}>
          Answer 3 quick questions and we'll recommend the best template for your business.
        </p>
        <button 
          onClick={() => navigate('/dashboard/products', { state: { showQuestionnaire: true } })}
          style={styles.helpBtn}
          className="btn btn-primary"
        >
          Get Recommendation
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1400px' },
  loading: { textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.5)' },
  header: { marginBottom: '32px' },
  title: { fontSize: '36px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { fontSize: '16px', color: 'rgba(255, 255, 255, 0.5)' },
  
  introCard: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '24px', 
    padding: '32px', 
    marginBottom: '32px',
    background: 'rgba(255, 159, 10, 0.05)',
    border: '1px solid rgba(255, 159, 10, 0.2)'
  },
  introIcon: { fontSize: '48px' },
  introContent: { flex: 1 },
  introTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '8px' },
  introText: { fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' },
  
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
    gap: '24px',
    marginBottom: '40px'
  },
  
  card: { 
    padding: '28px', 
    cursor: 'pointer', 
    transition: 'all 0.3s',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  cardHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  iconWrapper: { 
    width: '64px', 
    height: '64px', 
    borderRadius: '16px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  priceTag: { 
    padding: '6px 12px', 
    background: 'rgba(255, 159, 10, 0.2)', 
    borderRadius: '8px', 
    fontSize: '14px', 
    fontWeight: '700', 
    color: '#ff9f0a' 
  },
  
  cardTitle: { fontSize: '22px', fontWeight: '700' },
  jobStatement: { 
    fontSize: '15px', 
    color: 'rgba(255, 255, 255, 0.8)', 
    fontStyle: 'italic',
    lineHeight: '1.5'
  },
  
  bestFor: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '4px' 
  },
  bestForLabel: { 
    fontSize: '12px', 
    color: 'rgba(255, 255, 255, 0.5)', 
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  bestForValue: { 
    fontSize: '14px', 
    color: 'rgba(255, 255, 255, 0.7)' 
  },
  
  expandHint: { 
    fontSize: '13px', 
    color: 'rgba(255, 255, 255, 0.4)', 
    textAlign: 'center',
    marginTop: 'auto'
  },
  
  expandedContent: { 
    marginTop: '16px', 
    paddingTop: '16px', 
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  
  outcomesSection: {},
  outcomesTitle: { 
    fontSize: '14px', 
    fontWeight: '600', 
    marginBottom: '12px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  outcomesList: { 
    listStyle: 'none', 
    padding: 0, 
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  outcomeItem: { 
    display: 'flex', 
    alignItems: 'flex-start', 
    gap: '10px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  
  industriesSection: {},
  industriesTitle: { 
    fontSize: '14px', 
    fontWeight: '600', 
    marginBottom: '12px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  industriesTags: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: '8px' 
  },
  industryTag: { 
    padding: '6px 12px', 
    background: 'rgba(255, 255, 255, 0.05)', 
    borderRadius: '16px',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.7)'
  },
  
  useBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '8px', 
    padding: '14px 24px', 
    borderRadius: '12px', 
    border: 'none',
    color: 'white', 
    fontSize: '15px', 
    fontWeight: '600', 
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  
  helpSection: { 
    padding: '40px', 
    textAlign: 'center',
    background: 'rgba(139, 92, 246, 0.05)',
    border: '1px solid rgba(139, 92, 246, 0.2)'
  },
  helpTitle: { fontSize: '24px', fontWeight: '700', marginBottom: '12px' },
  helpText: { 
    fontSize: '16px', 
    color: 'rgba(255, 255, 255, 0.6)', 
    marginBottom: '24px' 
  },
  helpBtn: { 
    display: 'inline-flex', 
    alignItems: 'center', 
    gap: '8px' 
  }
};
