"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptTerms } from "@/lib/actions/rewards";

const rules = [
  { icon: "🔮", text: "แอปนี้ใช้คะแนนเสมือน (ญาณ) เท่านั้น" },
  { icon: "🚫", text: "ไม่มีการพนันด้วยเงินจริงทุกกรณี" },
  { icon: "💳", text: "คะแนนไม่สามารถแลกเปลี่ยนเป็นเงินสดได้" },
  { icon: "🤝", text: "เคารพและให้เกียรติผู้ใช้คนอื่นเสมอ" },
];

interface Props {
  onAccept: () => void;
}

export default function TermsConsentModal({ onAccept }: Props) {
  const [understood, setUnderstood] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);

  async function handleAccept() {
    if (!understood || loading) return;
    setLoading(true);
    await acceptTerms();
    setExiting(true);
    setTimeout(onAccept, 280);
  }

  return (
    <div className={`tcm-overlay ${exiting ? "tcm-overlay--exit" : ""}`}>
      <div className={`tcm-sheet ${exiting ? "tcm-sheet--exit" : ""}`}>
        <div className="tcm-glow" />

        {/* Handle bar */}
        <div className="tcm-handle" />

        {/* Header */}
        <div className="tcm-header">
          <div className="tcm-logo">🔮</div>
          <div>
            <h1 className="tcm-title">ยินดีต้อนรับสู่ Pawana</h1>
            <p className="tcm-subtitle">โปรดอ่านก่อนเริ่มใช้งาน</p>
          </div>
        </div>

        {/* Rules */}
        <ul className="tcm-rules">
          {rules.map((r) => (
            <li key={r.text} className="tcm-rule">
              <span className="tcm-rule-icon">{r.icon}</span>
              <span className="tcm-rule-text">{r.text}</span>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="tcm-divider" />

        {/* Checkbox */}
        <label className="tcm-checkbox-row" onClick={() => setUnderstood((v) => !v)}>
          <div className={`tcm-checkbox ${understood ? "tcm-checkbox--on" : ""}`}>
            {understood && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="tcm-checkbox-text">
            ฉันเข้าใจแล้วว่าคะแนนทั้งหมดเป็น<strong>เสมือนเท่านั้น</strong>{" "}
            และยอมรับ{" "}
            <Link
              href="/terms"
              className="tcm-link"
              onClick={(e) => e.stopPropagation()}
            >
              ข้อกำหนดการใช้บริการ
            </Link>
          </span>
        </label>

        {/* CTA */}
        <button
          className={`tcm-btn ${understood ? "tcm-btn--active" : "tcm-btn--locked"}`}
          onClick={handleAccept}
          disabled={!understood || loading}
        >
          {loading ? (
            <span className="tcm-spinner" />
          ) : (
            <>
              <span>ยอมรับและเข้าใช้งาน</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>

        <p className="tcm-note">เพื่อความบันเทิงเท่านั้น · ไม่ใช่การพนัน</p>
      </div>

      <style>{`
        .tcm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background: rgba(5,6,10,0.80);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: tcm-fade 0.25s ease both;
          transition: opacity 0.28s ease;
        }
        .tcm-overlay--exit { opacity: 0; }

        @keyframes tcm-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .tcm-sheet {
          position: relative;
          width: 100%;
          max-width: 480px;
          background: var(--bg-panel, #12101C);
          border: 1px solid rgba(111,75,255,0.22);
          border-bottom: none;
          border-radius: 28px 28px 0 0;
          padding: 12px 22px 44px;
          overflow: hidden;
          animation: tcm-rise 0.38s cubic-bezier(0.34,1.3,0.64,1) both;
          transition: transform 0.28s ease, opacity 0.28s ease;
        }
        .tcm-sheet--exit {
          transform: translateY(40px);
          opacity: 0;
        }

        @keyframes tcm-rise {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }

        .tcm-glow {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 360px;
          height: 240px;
          background: radial-gradient(ellipse, rgba(111,75,255,0.16) 0%, transparent 70%);
          pointer-events: none;
        }

        .tcm-handle {
          width: 40px;
          height: 4px;
          border-radius: 99px;
          background: rgba(255,255,255,0.10);
          margin: 0 auto 20px;
        }

        .tcm-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }

        .tcm-logo {
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(111,75,255,0.22), rgba(111,75,255,0.07));
          border: 1px solid rgba(111,75,255,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
        }

        .tcm-title {
          font-size: 19px;
          font-weight: 800;
          color: var(--text-primary, #F3F1FF);
          margin: 0 0 3px;
          letter-spacing: -0.01em;
        }

        .tcm-subtitle {
          font-size: 12.5px;
          color: var(--text-muted, #756D8F);
          margin: 0;
        }

        .tcm-rules {
          list-style: none;
          margin: 0 0 18px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tcm-rule {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.025);
          border: 1px solid var(--border-card, #2A1F45);
          border-radius: 14px;
          padding: 11px 14px;
          transition: border-color 0.2s;
        }

        .tcm-rule-icon {
          font-size: 17px;
          flex-shrink: 0;
          width: 28px;
          text-align: center;
        }

        .tcm-rule-text {
          font-size: 13px;
          color: var(--text-secondary, #A59BBF);
          line-height: 1.4;
        }

        .tcm-divider {
          height: 1px;
          background: var(--border-card, #2A1F45);
          margin-bottom: 16px;
        }

        /* ── Checkbox row ── */
        .tcm-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--border-soft, #35295A);
          background: rgba(111,75,255,0.04);
          cursor: pointer;
          margin-bottom: 16px;
          user-select: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .tcm-checkbox-row:hover {
          border-color: rgba(111,75,255,0.35);
          background: rgba(111,75,255,0.07);
        }

        .tcm-checkbox {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 7px;
          border: 2px solid var(--border-soft, #35295A);
          background: rgba(255,255,255,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 1px;
          transition: all 0.18s;
        }

        .tcm-checkbox--on {
          background: var(--purple, #6F4BFF);
          border-color: var(--purple, #6F4BFF);
          box-shadow: 0 0 14px rgba(111,75,255,0.40);
        }

        .tcm-checkbox-text {
          font-size: 13px;
          color: var(--text-secondary, #A59BBF);
          line-height: 1.6;
        }

        .tcm-checkbox-text strong {
          color: var(--text-primary, #F3F1FF);
          font-weight: 700;
        }

        .tcm-link {
          color: var(--purple-soft, #7B61FF);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        /* ── Button ── */
        .tcm-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px;
          border-radius: 18px;
          font-size: 15px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: all 0.2s;
          margin-bottom: 12px;
        }

        .tcm-btn--active {
          background: linear-gradient(135deg, #6F4BFF, #8B65FF);
          color: #fff;
          box-shadow: 0 8px 28px rgba(111,75,255,0.40);
        }

        .tcm-btn--active:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(111,75,255,0.52);
        }

        .tcm-btn--locked {
          background: rgba(255,255,255,0.05);
          color: var(--text-muted, #756D8F);
          cursor: not-allowed;
          border: 1px solid var(--border-card, #2A1F45);
        }

        .tcm-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: tcm-spin 0.7s linear infinite;
        }

        @keyframes tcm-spin {
          to { transform: rotate(360deg); }
        }

        .tcm-note {
          font-size: 11px;
          color: var(--text-muted, #756D8F);
          text-align: center;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
