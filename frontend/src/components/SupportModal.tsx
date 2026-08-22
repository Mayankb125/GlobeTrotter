import React, { useState } from 'react';
import { useToast } from './Toast';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [category, setCategory] = useState('Itinerary Builder Help');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Support ticket submitted to GlobeTrotter!', '📨');
    setSubject('');
    setMessage('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="support-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="row gap10">
            <span style={{ fontSize: '18px' }}>❓</span>
            <div>
              <h3 style={{ fontSize: '16px', color: '#fff' }}>GlobeTrotter Help & Support</h3>
              <p className="xsmall" style={{ color: 'var(--night-muted)' }}>
                Live AI support & FAQs
              </p>
            </div>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}
          >
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <div
            className="card card-pad"
            style={{ marginBottom: '18px', background: 'var(--harbor-tint)', borderColor: 'var(--harbor)' }}
          >
            <div className="row between">
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--harbor)' }}>
                  💬 Need Instant Travel Assistance?
                </div>
                <p className="small muted" style={{ marginTop: '2px' }}>
                  GlobeTrotter AI Agent is available 24/7 to solve booking & route questions.
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => showToast('AI Support Chat initialized', '🤖')}
              >
                Start AI Chat
              </button>
            </div>
          </div>

          <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Frequently Asked Questions</h4>
          <div className="col gap8" style={{ marginBottom: '20px' }}>
            <div className="card card-pad" style={{ padding: '12px 16px' }}>
              <div
                className="row between"
                onClick={() => toggleFaq(0)}
                style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                <span>How do I change currency to ₹ INR?</span>
                <span>{openFaq === 0 ? '－' : '＋'}</span>
              </div>
              {openFaq === 0 && (
                <p className="small muted" style={{ marginTop: '8px' }}>
                  Go to <b>Profile & Settings</b> → Currency dropdown → Select <b>INR ₹</b>. All budget breakdowns update automatically.
                </p>
              )}
            </div>

            <div className="card card-pad" style={{ padding: '12px 16px' }}>
              <div
                className="row between"
                onClick={() => toggleFaq(1)}
                style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                <span>How does OpenStreetMap & OSRM routing work?</span>
                <span>{openFaq === 1 ? '－' : '＋'}</span>
              </div>
              {openFaq === 1 && (
                <p className="small muted" style={{ marginTop: '8px' }}>
                  GlobeTrotter connects directly to Project OSRM to calculate precise driving distances in kilometers and transit durations between your itinerary stops.
                </p>
              )}
            </div>

            <div className="card card-pad" style={{ padding: '12px 16px' }}>
              <div
                className="row between"
                onClick={() => toggleFaq(2)}
                style={{ cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
              >
                <span>Can I share my itinerary with friends?</span>
                <span>{openFaq === 2 ? '－' : '＋'}</span>
              </div>
              {openFaq === 2 && (
                <p className="small muted" style={{ marginTop: '8px' }}>
                  Yes! Click <b>↗ Public Itinerary</b> in the left sidebar to copy your custom shareable link or preview your public trip page.
                </p>
              )}
            </div>
          </div>

          <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Submit a Support Ticket</h4>
          <form onSubmit={handleSubmitTicket}>
            <div className="field">
              <label>Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>Itinerary Builder Help</option>
                <option>Authentication Support</option>
                <option>OpenStreetMap / Route Issue</option>
                <option>Budget & Currency Question</option>
              </select>
            </div>
            <div className="field">
              <label>Subject</label>
              <input
                className="input"
                placeholder="Brief summary of your question"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Describe your question or feedback..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-sundial btn-block">
              Submit Support Ticket →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
