import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

export default function TemplateQuestionnaire({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    industry: null,
    challenge: null,
    productCount: null
  });
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);

  const industries = [
    { value: 'instagram', label: 'Instagram Product Sales', emoji: '📱', desc: 'Selling products via Instagram' },
    { value: 'services', label: 'Professional Services', emoji: '💼', desc: 'Photography, coaching, consulting' },
    { value: 'food', label: 'Food & Beverages', emoji: '🍽️', desc: 'Restaurant, catering, delivery' },
    { value: 'events', label: 'Events & Experiences', emoji: '🎉', desc: 'Concerts, workshops, classes' },
    { value: 'highticket', label: 'High-Value Items', emoji: '💎', desc: 'Electronics, furniture, jewelry' },
    { value: 'multiproduct', label: 'Multi-Product Store', emoji: '🛒', desc: '10+ different products' }
  ];

  const challenges = [
    { value: 'trust', label: "People don't trust me yet", emoji: '🤝', desc: "I'm new or unknown to customers" },
    { value: 'decision-paralysis', label: "Customers can't decide", emoji: '🤔', desc: 'Too many options confuse them' },
    { value: 'value-communication', label: "They don't see the value", emoji: '💰', desc: 'They focus only on price' },
    { value: 'portfolio', label: "Can't showcase my work", emoji: '📸', desc: 'Need to show my portfolio' },
    { value: 'catalog-confusion', label: 'Products get lost', emoji: '🔍', desc: 'Hard to find what they need' },
    { value: 'speed', label: 'Checkout is too slow', emoji: '⚡', desc: 'Need faster conversions' }
  ];

  const productCounts = [
    { value: '1-3', label: '1-3 products', desc: 'Just getting started' },
    { value: '4-10', label: '4-10 products', desc: 'Growing catalog' },
    { value: '10+', label: '10+ products', desc: 'Full product range' }
  ];

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Get recommendation
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/templates/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers)
        });
        const data = await response.json();
        if (data.success) {
          setRecommendation(data);
          setStep(4);
        }
      } catch (error) {
        console.error('Failed to get recommendation:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const selectOption = (key, value) => {
    setAnswers({ ...answers, [key]: value });
  };

  const canProceed = () => {
    if (step === 1) return answers.industry;
    if (step === 2) return answers.challenge;
    if (step === 3) return answers.productCount;
    return true;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal} className="glass-card">
        {/* Progress */}
        <div style={styles.progress}>
          {[1, 2, 3].map(n => (
            <div 
              key={n}
              style={{
                ...styles.progressDot,
                background: step >= n ? '#ff9f0a' : 'rgba(255, 255, 255, 0.2)'
              }}
            />
          ))}
        </div>

        {/* Step 1: Industry */}
        {step === 1 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>What type of business are you running?</h2>
            <p style={styles.stepSubtitle}>We'll recommend the best template for your industry</p>
            
            <div style={styles.optionsGrid}>
              {industries.map(ind => (
                <button
                  key={ind.value}
                  onClick={() => selectOption('industry', ind.value)}
                  style={{
                    ...styles.optionCard,
                    borderColor: answers.industry === ind.value ? '#ff9f0a' : 'rgba(255, 255, 255, 0.1)',
                    background: answers.industry === ind.value ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <span style={styles.optionEmoji}>{ind.emoji}</span>
                  <span style={styles.optionLabel}>{ind.label}</span>
                  <span style={styles.optionDesc}>{ind.desc}</span>
                  {answers.industry === ind.value && (
                    <div style={styles.checkMark}><Check size={16} /></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Challenge */}
        {step === 2 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>What's your biggest challenge?</h2>
            <p style={styles.stepSubtitle}>We understand - let's solve it together</p>
            
            <div style={styles.optionsGrid}>
              {challenges.map(ch => (
                <button
                  key={ch.value}
                  onClick={() => selectOption('challenge', ch.value)}
                  style={{
                    ...styles.optionCard,
                    borderColor: answers.challenge === ch.value ? '#ff9f0a' : 'rgba(255, 255, 255, 0.1)',
                    background: answers.challenge === ch.value ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <span style={styles.optionEmoji}>{ch.emoji}</span>
                  <span style={styles.optionLabel}>{ch.label}</span>
                  <span style={styles.optionDesc}>{ch.desc}</span>
                  {answers.challenge === ch.value && (
                    <div style={styles.checkMark}><Check size={16} /></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Product Count */}
        {step === 3 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>How many products will you sell?</h2>
            <p style={styles.stepSubtitle}>This helps us suggest the right layout</p>
            
            <div style={styles.countOptions}>
              {productCounts.map(pc => (
                <button
                  key={pc.value}
                  onClick={() => selectOption('productCount', pc.value)}
                  style={{
                    ...styles.countCard,
                    borderColor: answers.productCount === pc.value ? '#ff9f0a' : 'rgba(255, 255, 255, 0.1)',
                    background: answers.productCount === pc.value ? 'rgba(255, 159, 10, 0.1)' : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <span style={styles.countLabel}>{pc.label}</span>
                  <span style={styles.countDesc}>{pc.desc}</span>
                  {answers.productCount === pc.value && (
                    <div style={styles.checkMark}><Check size={16} /></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Recommendation */}
        {step === 4 && recommendation && (
          <div style={styles.stepContent}>
            <div style={styles.recommendHeader}>
              <Sparkles size={32} style={{ color: '#ff9f0a' }} />
              <h2 style={styles.recommendTitle}>Perfect Match Found!</h2>
            </div>
            
            <div style={styles.recommendCard}>
              <div style={styles.recommendName}>{recommendation.recommended.name}</div>
              <div style={styles.recommendPrice}>
                KES {parseInt(recommendation.recommended.price).toLocaleString()}
              </div>
              <p style={styles.recommendJob}>
                "{recommendation.recommended.job_statement}"
              </p>
              <p style={styles.recommendReason}>
                {recommendation.reasoning}
              </p>
              
              <div style={styles.outcomesPreview}>
                {recommendation.recommended.key_outcomes?.slice(0, 3).map((outcome, idx) => (
                  <div key={idx} style={styles.outcomeRow}>
                    <Check size={16} style={{ color: '#30d158' }} />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={() => onComplete(recommendation.recommended)}
              style={styles.useTemplateBtn}
              className="btn btn-primary"
            >
              Use This Template
              <ArrowRight size={18} />
            </button>

            {recommendation.alternatives?.length > 0 && (
              <div style={styles.alternatives}>
                <p style={styles.altTitle}>Other options:</p>
                <div style={styles.altList}>
                  {recommendation.alternatives.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onComplete(alt)}
                      style={styles.altBtn}
                    >
                      {alt.name} - KES {parseInt(alt.price).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={styles.navButtons}>
          {step > 1 && step < 4 && (
            <button onClick={handleBack} style={styles.backBtn}>
              <ArrowLeft size={18} />
              Back
            </button>
          )}
          
          {step < 4 && (
            <button 
              onClick={handleNext}
              disabled={!canProceed() || loading}
              style={{
                ...styles.nextBtn,
                opacity: canProceed() ? 1 : 0.5
              }}
              className="btn btn-primary"
            >
              {loading ? 'Finding...' : step === 3 ? 'Get Recommendation' : 'Next'}
              <ArrowRight size={18} />
            </button>
          )}
          
          <button onClick={onCancel} style={styles.cancelBtn}>
            Skip & Browse All
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '40px'
  },
  
  progress: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '32px'
  },
  progressDot: {
    width: '40px',
    height: '4px',
    borderRadius: '2px',
    transition: 'all 0.3s'
  },
  
  stepContent: {
    marginBottom: '32px'
  },
  stepTitle: {
    fontSize: '28px',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: '8px'
  },
  stepSubtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: '32px'
  },
  
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px'
  },
  optionCard: {
    position: 'relative',
    padding: '20px',
    borderRadius: '16px',
    border: '2px solid',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.2s',
    background: 'none'
  },
  optionEmoji: {
    fontSize: '32px'
  },
  optionLabel: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'white'
  },
  optionDesc: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)'
  },
  checkMark: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#ff9f0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  
  countOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '400px',
    margin: '0 auto'
  },
  countCard: {
    position: 'relative',
    padding: '24px',
    borderRadius: '16px',
    border: '2px solid',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    transition: 'all 0.2s',
    background: 'none',
    textAlign: 'left'
  },
  countLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white'
  },
  countDesc: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)'
  },
  
  recommendHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px'
  },
  recommendTitle: {
    fontSize: '28px',
    fontWeight: '800'
  },
  recommendCard: {
    padding: '32px',
    background: 'rgba(255, 159, 10, 0.1)',
    border: '2px solid rgba(255, 159, 10, 0.3)',
    borderRadius: '20px',
    marginBottom: '24px'
  },
  recommendName: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '8px'
  },
  recommendPrice: {
    fontSize: '20px',
    color: '#ff9f0a',
    fontWeight: '700',
    marginBottom: '16px'
  },
  recommendJob: {
    fontSize: '16px',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '16px'
  },
  recommendReason: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '20px'
  },
  outcomesPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  outcomeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.8)'
  },
  
  useTemplateBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '24px'
  },
  
  alternatives: {
    textAlign: 'center'
  },
  altTitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '12px'
  },
  altList: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '8px'
  },
  altBtn: {
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  
  navButtons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    background: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '15px',
    cursor: 'pointer'
  },
  nextBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 32px'
  },
  cancelBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px'
  }
};
