"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const sections = [
  {
    icon: "⚡",
    title: "วัตถุประสงค์ของแพลตฟอร์ม",
    id: "purpose",
    content: `Pawana เป็นแพลตฟอร์มเพื่อความบันเทิงสำหรับการทำนายผลเหตุการณ์ต่าง ๆ ผู้ใช้สามารถแสดงความคิดเห็นและทำนายผลได้โดยใช้คะแนนเสมือน (Virtual Points) ซึ่งไม่มีมูลค่าทางการเงินใด ๆ ทั้งสิ้น

แพลตฟอร์มนี้ออกแบบมาเพื่อสร้างประสบการณ์ชุมชนที่สนุกสนานและน่าสนใจ ไม่ใช่เพื่อวัตถุประสงค์ทางการเงินหรือการพนัน การใช้งานแพลตฟอร์มถือว่าผู้ใช้ยอมรับเงื่อนไขเหล่านี้โดยสมบูรณ์`,
  },
  {
    icon: "🔮",
    title: "นโยบายคะแนนเสมือน",
    id: "points",
    content: `คะแนนเสมือน (Virtual Points / ญาณ) ในแอปพลิเคชันนี้:

• ไม่มีมูลค่าทางการเงินใด ๆ ทั้งสิ้น
• ไม่สามารถแลกเปลี่ยนเป็นเงินสด สินค้า หรือบริการใด ๆ ได้
• ไม่สามารถโอนให้ผู้ใช้คนอื่นได้
• ไม่สามารถซื้อหรือขายในตลาดใด ๆ ได้
• อาจถูกรีเซ็ตหรือปรับเปลี่ยนได้ตามดุลยพินิจของผู้ดูแลระบบ

คะแนนมีไว้เพื่อสะท้อนความแม่นยำในการทำนายและสร้างความสนุกสนานเท่านั้น`,
  },
  {
    icon: "🚫",
    title: "กิจกรรมที่ต้องห้าม",
    id: "prohibited",
    content: `ผู้ใช้ต้องไม่กระทำการดังต่อไปนี้:

• พยายามแปลงคะแนนเสมือนเป็นสิ่งที่มีมูลค่าจริง
• สร้างหรือดำเนินการตลาดซื้อขายคะแนน
• ใช้บอท สคริปต์ หรือวิธีการอัตโนมัติเพื่อเพิ่มคะแนน
• สร้างบัญชีหลายบัญชีเพื่อเอาเปรียบระบบ
• จงใจบิดเบือนผลการทำนายหรือชุมชน
• แบ่งปันข้อมูลบัญชีกับผู้อื่น
• กระทำการใด ๆ ที่ทำให้แพลตฟอร์มหรือผู้ใช้อื่นเสียหาย`,
  },
  {
    icon: "🤝",
    title: "การปฏิบัติตัวของผู้ใช้",
    id: "conduct",
    content: `ผู้ใช้ทุกคนพึงปฏิบัติตามมาตรฐานชุมชนของเรา:

• แสดงความเคารพต่อผู้ใช้คนอื่นในทุกการสื่อสาร
• ไม่โพสต์เนื้อหาที่ไม่เหมาะสม หยาบคาย หรือเป็นอันตราย
• ไม่เผยแพร่ข้อมูลเท็จหรือทำให้ผู้อื่นเข้าใจผิด
• ปฏิบัติตามกฎหมายและข้อบังคับที่เกี่ยวข้องทั้งหมด
• รายงานพฤติกรรมที่ผิดปกติหรือน่าสงสัยต่อทีมงาน`,
  },
  {
    icon: "⚠️",
    title: "การระงับบัญชี",
    id: "suspension",
    content: `Pawana ขอสงวนสิทธิ์ในการ:

• ระงับหรือยกเลิกบัญชีที่ละเมิดข้อกำหนดเหล่านี้ โดยไม่ต้องแจ้งล่วงหน้า
• ลบคะแนน เนื้อหา หรือข้อมูลที่เกี่ยวข้องกับการละเมิด
• บล็อกการเข้าถึงบัญชีชั่วคราวหรือถาวรตามความเหมาะสม
• รายงานพฤติกรรมที่ผิดกฎหมายต่อหน่วยงานที่เกี่ยวข้อง

การตัดสินใจของ Pawana ในเรื่องเหล่านี้ถือเป็นที่สุด`,
  },
  {
    icon: "🛡️",
    title: "ข้อจำกัดความรับผิดชอบ",
    id: "liability",
    content: `Pawana ให้บริการ "ตามสภาพที่เป็น" โดยไม่รับประกันความต่อเนื่องหรือความสมบูรณ์ของบริการ

เราไม่รับผิดชอบต่อ:
• การสูญเสียคะแนนเสมือนจากข้อผิดพลาดทางเทคนิค
• การหยุดชะงักของบริการชั่วคราว
• การเปลี่ยนแปลงฟีเจอร์หรือกฎของเกม
• ความเสียหายทางอ้อมจากการใช้บริการ

เนื่องจากคะแนนไม่มีมูลค่าจริง การสูญเสียใด ๆ จึงไม่ถือเป็นความเสียหายทางการเงิน`,
  },
  {
    icon: "📋",
    title: "การอัปเดตข้อกำหนด",
    id: "updates",
    content: `Pawana อาจปรับปรุงข้อกำหนดการให้บริการนี้ได้ตลอดเวลา:

• การเปลี่ยนแปลงสำคัญจะแจ้งให้ทราบผ่านแอปพลิเคชัน
• การใช้งานแพลตฟอร์มต่อไปหลังจากมีการอัปเดตถือว่ายอมรับข้อกำหนดใหม่
• ผู้ใช้สามารถตรวจสอบข้อกำหนดล่าสุดได้ที่หน้านี้เสมอ
• วันที่มีผลบังคับใช้ล่าสุด: 16 พฤษภาคม 2026`,
  },
];

const tldrItems = [
  {
    icon: "💳",
    label: "ไม่มีเงินจริง",
    desc: "ทุกอย่างเป็นคะแนนเสมือนเพื่อความบันเทิงเท่านั้น",
    color: "purple",
  },
  {
    icon: "🏦",
    label: "ไม่สามารถถอนเงินได้",
    desc: "คะแนนไม่สามารถแลกเปลี่ยนเป็นเงินสดหรือสิ่งของมีค่าได้",
    color: "gold",
  },
  {
    icon: "🔄",
    label: "ไม่สามารถโอนคะแนนได้",
    desc: "คะแนนเป็นของบัญชีคุณเท่านั้น ไม่สามารถส่งต่อได้",
    color: "teal",
  },
];

export default function TermsPage() {
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  return (
    <div className="terms-root">
      {/* Background ambient */}
      <div className="terms-bg-glow" />

      <div className="terms-container">
        {/* ── Hero Header ── */}
        <header className="terms-hero">
          <div className="terms-badge">
            <span className="terms-badge-dot" />
            สำหรับผู้ใช้ทุกคน
          </div>
          <h1 className="terms-title">ข้อกำหนดการใช้บริการ</h1>
          <p className="terms-subtitle">
            แพลตฟอร์มทำนายผลเพื่อความบันเทิง — ไม่ใช่การพนัน ไม่ใช่การลงทุน
          </p>
          <div className="terms-warning-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            ไม่มีเงินจริง · ไม่ใช่การพนัน · เพื่อความบันเทิงเท่านั้น
          </div>
        </header>

        {/* ── TL;DR Card ── */}
        <div className="terms-card tldr-card">
          <div className="tldr-header">
            <div className="tldr-header-icon">⚡</div>
            <div>
              <p className="tldr-label">สรุปสั้น ๆ</p>
              <p className="tldr-sublabel">สิ่งสำคัญที่ควรรู้ก่อนใช้งาน</p>
            </div>
          </div>
          <div className="tldr-items">
            {tldrItems.map((item) => (
              <div key={item.label} className={`tldr-item tldr-item--${item.color}`}>
                <span className="tldr-item-icon">{item.icon}</span>
                <div>
                  <p className="tldr-item-label">{item.label}</p>
                  <p className="tldr-item-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Important Warning Box ── */}
        <div className="terms-warning-box">
          <div className="terms-warning-box-inner">
            <div className="warning-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="warning-title">ข้อความสำคัญ</p>
              <p className="warning-body">
                คะแนนเสมือน (ญาณ) เป็นเพียงสินทรัพย์จำลองเพื่อความบันเทิงเท่านั้น{" "}
                <strong>ไม่มีมูลค่าทางการค้าหรือการเงินใด ๆ</strong>{" "}
                และไม่สามารถใช้แลกเปลี่ยนสิ่งตอบแทนในโลกจริงได้ทุกกรณี
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Sections ── */}
        <div className="terms-sections">
          {sections.map((section, i) => (
            <div key={section.id} className="terms-card section-card">
              <div className="section-header">
                <div className="section-icon">{section.icon}</div>
                <div>
                  <span className="section-number">0{i + 1}</span>
                  <h2 className="section-title">{section.title}</h2>
                </div>
              </div>
              <div className="section-divider" />
              <p className="section-body">{section.content}</p>
            </div>
          ))}
        </div>

        {/* ── Acceptance Section ── */}
        <div className="terms-card acceptance-card">
          <h3 className="acceptance-title">ยืนยันการยอมรับ</h3>
          <p className="acceptance-sub">กรุณาอ่านและยืนยันก่อนใช้งาน</p>
          <label className="checkbox-label" onClick={() => setAccepted((v) => !v)}>
            <div className={`checkbox-box ${accepted ? "checkbox-box--checked" : ""}`}>
              {accepted && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="checkbox-text">
              ฉันเข้าใจว่าคะแนนทั้งหมดในแอปนี้เป็นคะแนนเสมือน{" "}
              <strong>ไม่สามารถแลกเปลี่ยนเป็นเงินหรือสิ่งของมีค่าได้</strong>
            </span>
          </label>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="terms-cta-wrap">
          <button
            className={`terms-cta-btn ${accepted ? "terms-cta-btn--active" : "terms-cta-btn--disabled"}`}
            disabled={!accepted}
            onClick={() => accepted && router.back()}
          >
            <span>ยอมรับและดำเนินการต่อ</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <p className="terms-cta-note">
            วันที่มีผลบังคับใช้: 16 พฤษภาคม 2026 · เวอร์ชัน 1.0
          </p>
        </div>
      </div>

      <style>{`
        .terms-root {
          min-height: 100vh;
          background: var(--bg-global, #05060A);
          position: relative;
          overflow-x: hidden;
          padding-bottom: 60px;
        }

        .terms-bg-glow {
          position: fixed;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(111,75,255,0.10) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .terms-container {
          position: relative;
          z-index: 1;
          max-width: 680px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* ── Hero ── */
        .terms-hero {
          text-align: center;
          padding: 48px 0 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .terms-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(111,75,255,0.12);
          border: 1px solid rgba(111,75,255,0.25);
          color: #9B7FFF;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 99px;
        }

        .terms-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #7B61FF;
          box-shadow: 0 0 6px #7B61FF;
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .terms-title {
          font-size: clamp(28px, 6vw, 40px);
          font-weight: 800;
          letter-spacing: -0.02em;
          background: linear-gradient(135deg, #F3F1FF 30%, #9B7FFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          line-height: 1.1;
        }

        .terms-subtitle {
          font-size: 15px;
          color: var(--text-secondary, #A59BBF);
          margin: 0;
          max-width: 380px;
          line-height: 1.6;
        }

        .terms-warning-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(215,181,109,0.08);
          border: 1px solid rgba(215,181,109,0.22);
          color: #D7B56D;
          font-size: 11.5px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 99px;
        }

        /* ── Card base ── */
        .terms-card {
          background: var(--bg-card, #14111F);
          border: 1px solid var(--border-card, #2A1F45);
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .terms-card:hover {
          border-color: var(--border-soft, #35295A);
          box-shadow: 0 8px 32px rgba(111,75,255,0.07);
        }

        /* ── TL;DR ── */
        .tldr-card {
          background: linear-gradient(135deg, rgba(111,75,255,0.07) 0%, rgba(20,17,31,1) 60%);
          border-color: rgba(111,75,255,0.28);
        }

        .tldr-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }

        .tldr-header-icon {
          font-size: 24px;
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(111,75,255,0.14);
          border-radius: 12px;
        }

        .tldr-label {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #F3F1FF);
          margin: 0;
        }

        .tldr-sublabel {
          font-size: 12px;
          color: var(--text-muted, #756D8F);
          margin: 2px 0 0;
        }

        .tldr-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tldr-item {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid;
        }

        .tldr-item--purple {
          background: rgba(111,75,255,0.07);
          border-color: rgba(111,75,255,0.18);
        }

        .tldr-item--gold {
          background: rgba(215,181,109,0.06);
          border-color: rgba(215,181,109,0.16);
        }

        .tldr-item--teal {
          background: rgba(56,189,167,0.06);
          border-color: rgba(56,189,167,0.16);
        }

        .tldr-item-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .tldr-item-label {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-primary, #F3F1FF);
          margin: 0 0 3px;
        }

        .tldr-item-desc {
          font-size: 12px;
          color: var(--text-secondary, #A59BBF);
          margin: 0;
          line-height: 1.5;
        }

        /* ── Warning Box ── */
        .terms-warning-box {
          background: linear-gradient(135deg, rgba(215,181,109,0.08), rgba(200,100,60,0.06));
          border: 1px solid rgba(215,181,109,0.25);
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 14px;
        }

        .terms-warning-box-inner {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }

        .warning-icon-wrap {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: rgba(215,181,109,0.14);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #D7B56D;
        }

        .warning-title {
          font-size: 13px;
          font-weight: 700;
          color: #D7B56D;
          margin: 0 0 6px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .warning-body {
          font-size: 13.5px;
          color: rgba(215,181,109,0.85);
          margin: 0;
          line-height: 1.65;
        }

        .warning-body strong {
          color: #D7B56D;
          font-weight: 700;
        }

        /* ── Sections ── */
        .terms-sections {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 14px;
        }

        .section-card {
          padding: 22px;
        }

        .section-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 16px;
        }

        .section-icon {
          font-size: 20px;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(111,75,255,0.10);
          border: 1px solid rgba(111,75,255,0.15);
          border-radius: 11px;
        }

        .section-number {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--text-muted, #756D8F);
          text-transform: uppercase;
          display: block;
          margin-bottom: 3px;
        }

        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary, #F3F1FF);
          margin: 0;
          line-height: 1.3;
        }

        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, var(--border-card, #2A1F45) 0%, transparent 100%);
          margin-bottom: 16px;
        }

        .section-body {
          font-size: 13.5px;
          color: var(--text-secondary, #A59BBF);
          line-height: 1.8;
          margin: 0;
          white-space: pre-line;
        }

        /* ── Acceptance ── */
        .acceptance-card {
          background: linear-gradient(135deg, rgba(111,75,255,0.06), var(--bg-card, #14111F));
          border-color: rgba(111,75,255,0.22);
        }

        .acceptance-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary, #F3F1FF);
          margin: 0 0 4px;
        }

        .acceptance-sub {
          font-size: 12px;
          color: var(--text-muted, #756D8F);
          margin: 0 0 18px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-box {
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
          transition: all 0.2s;
        }

        .checkbox-box--checked {
          background: var(--purple, #6F4BFF);
          border-color: var(--purple, #6F4BFF);
          box-shadow: 0 0 16px rgba(111,75,255,0.35);
        }

        .checkbox-text {
          font-size: 13.5px;
          color: var(--text-secondary, #A59BBF);
          line-height: 1.6;
        }

        .checkbox-text strong {
          color: var(--text-primary, #F3F1FF);
        }

        /* ── CTA ── */
        .terms-cta-wrap {
          text-align: center;
          padding-top: 8px;
        }

        .terms-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 360px;
          padding: 16px 28px;
          border-radius: 16px;
          font-size: 15px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: all 0.25s;
          letter-spacing: 0.01em;
        }

        .terms-cta-btn--active {
          background: linear-gradient(135deg, #6F4BFF, #8B65FF);
          color: white;
          box-shadow: 0 8px 28px rgba(111,75,255,0.40);
        }

        .terms-cta-btn--active:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(111,75,255,0.50);
        }

        .terms-cta-btn--active:active {
          transform: translateY(0);
        }

        .terms-cta-btn--disabled {
          background: rgba(255,255,255,0.05);
          color: var(--text-muted, #756D8F);
          cursor: not-allowed;
          border: 1px solid var(--border-card, #2A1F45);
        }

        .terms-cta-note {
          font-size: 11px;
          color: var(--text-muted, #756D8F);
          margin: 14px 0 0;
        }
      `}</style>
    </div>
  );
}
