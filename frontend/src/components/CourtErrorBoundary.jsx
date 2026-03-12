import React from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

class CourtErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[JUDICIAL] Court Registry Collapse:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    padding: 80, 
                    textAlign: 'center', 
                    background: 'rgba(239,68,68,0.02)', 
                    borderRadius: 24, 
                    border: '1px dashed var(--danger)',
                    marginTop: 40
                }}>
                    <AlertTriangle size={48} style={{ color: 'var(--danger)', marginBottom: 20 }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 16 }}>Judicial Interface Friction</h2>
                    <p style={{ color: 'var(--text-tertiary)', marginBottom: 32 }}>
                        The local Court Registry encountered a synchronization gap.
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 24px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600 }}>
                        <RefreshCcw size={16} className="animate-spin" />
                        Re-syncing with AggLayer...
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default CourtErrorBoundary;
