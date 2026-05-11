-- ภาวนา — Seed Predictions
-- สร้าง system user สำหรับ seed data แล้ว insert predictions ตัวอย่าง

-- Step 1: สร้าง system user ใน auth.users ก่อน (จำเป็นเพราะ profiles FK)
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_user_meta_data, role, aud
) values (
  '00000000-0000-0000-0000-000000000001',
  'system@pawana.app',
  '',
  now(), now(), now(),
  '{"username":"pawana_system","display_name":"ภาวนา System"}',
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Step 2: สร้าง system profile
insert into public.profiles (id, username, display_name, title, tier, coins, xp, level)
values (
  '00000000-0000-0000-0000-000000000001',
  'pawana_system',
  'ภาวนา System',
  'ผู้ดูแลระบบ',
  'legend',
  9999999,
  99999,
  99
) on conflict (id) do nothing;

-- Step 3: Insert predictions
insert into public.predictions
  (id, creator_id, category_id, title, description, ends_at, yes_pool, no_pool, participant_count, is_featured, is_trending)
values
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    2, -- เกม
    'GTA 6 จะวางจำหน่ายในปี 2025 จริงไหม?',
    'Rockstar Games ประกาศว่าจะออกในปี 2025 แต่หลายคนสงสัยว่าจะเลื่อนอีก',
    now() + interval '60 days',
    45000, 32000, 312, true, true
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    4, -- การเงิน
    'Bitcoin จะทะลุ $150,000 ภายในปี 2025?',
    'หลังจาก ETF Spot ได้รับอนุมัติ ราคา BTC พุ่งสูงขึ้นต่อเนื่อง',
    now() + interval '90 days',
    88000, 41000, 567, true, true
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    3, -- กีฬา
    'ทีมชาติไทยจะผ่านเข้ารอบ 16 ทีม Asian Cup ได้ไหม?',
    'ฟอร์มทีมชาติไทยดีขึ้นมากในช่วงนี้',
    now() + interval '45 days',
    23000, 18000, 198, false, true
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    1, -- ดราม่า
    'ดาราคู่นี้จะประกาศเลิกกันภายใน 3 เดือน?',
    'กระแสโซเชียลพูดถึงปัญหาในความสัมพันธ์ของทั้งคู่',
    now() + interval '30 days',
    15000, 28000, 421, false, true
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    5, -- ไวรัล
    'วิดีโอนี้จะทะลุ 100 ล้านวิวบน TikTok ภายใน 1 เดือน?',
    'วิดีโอเต้นไวรัลล่าสุดที่กำลังมาแรงทั่วโลก',
    now() + interval '30 days',
    9000, 6000, 88, false, false
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    4, -- การเงิน
    'SET Index จะแตะ 1,500 จุด ภายในสิ้นปี 2025?',
    'ตลาดหุ้นไทยซึมมานาน นักวิเคราะห์มองต่างกัน',
    now() + interval '120 days',
    31000, 52000, 274, true, false
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    2, -- เกม
    'Marvel Rivals จะยังเป็น Top 10 Steam ถึงสิ้นปีไหม?',
    'เกม Hero Shooter ใหม่จาก Marvel กำลังมาแรง',
    now() + interval '50 days',
    18000, 12000, 155, false, true
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    3, -- กีฬา
    'ลิเวอร์พูลจะคว้าแชมป์ Premier League ฤดูกาลนี้?',
    'ฟอร์มแกร่งมาตลอดครึ่งฤดูกาลแรก',
    now() + interval '75 days',
    67000, 34000, 489, true, true
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    6, -- อื่นๆ
    'AI จะสามารถแต่งเพลงที่ติด Top 10 Billboard ได้ในปี 2025?',
    'เทคโนโลยี AI ด้านดนตรีพัฒนาไวมาก',
    now() + interval '180 days',
    24000, 38000, 302, false, false
  ),
  (
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000001',
    1, -- ดราม่า
    'ซีรีส์ที่รอคอยจะได้ฉาย Season 2 จริงไหม?',
    'ทีมงานยังไม่ประกาศอย่างเป็นทางการ แต่มีข่าวลือเยอะมาก',
    now() + interval '90 days',
    19000, 8000, 143, false, false
  );
