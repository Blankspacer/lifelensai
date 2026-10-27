import { SampleDocument } from '../types';

// Helper to convert SVG string to data URI
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

// 1. Confusing Utility Bill (Electric Bill)
const electricBillSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" style="background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Header Bar -->
  <rect width="800" height="90" fill="#0f172a" />
  <text x="40" y="55" fill="#38bdf8" font-size="28" font-weight="bold">PACIFIC POWER &amp; LIGHT CO.</text>
  <text x="760" y="55" fill="#94a3b8" font-size="14" text-anchor="end">ELECTRIC RESIDENTIAL SERVICE STATEMENT</text>

  <!-- Summary Box -->
  <rect x="40" y="110" width="720" height="140" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
  <text x="65" y="145" fill="#64748b" font-size="13" font-weight="600">ACCOUNT NUMBER</text>
  <text x="65" y="172" fill="#0f172a" font-size="19" font-weight="bold">#8841-9210-994</text>
  
  <text x="300" y="145" fill="#64748b" font-size="13" font-weight="600">BILLING CYCLE</text>
  <text x="300" y="172" fill="#0f172a" font-size="16">Sep 28, 2026 – Oct 27, 2026</text>

  <rect x="520" y="125" width="220" height="110" rx="6" fill="#fef2f2" stroke="#fca5a5" stroke-width="1" />
  <text x="540" y="152" fill="#991b1b" font-size="12" font-weight="bold">TOTAL AMOUNT DUE</text>
  <text x="540" y="190" fill="#b91c1c" font-size="32" font-weight="800">$184.65</text>
  <text x="540" y="218" fill="#b91c1c" font-size="12" font-weight="bold">DUE BY: NOV 12, 2026</text>

  <!-- Notice Banner -->
  <rect x="40" y="265" width="720" height="40" rx="4" fill="#fffbeb" stroke="#fde68a" stroke-width="1" />
  <text x="55" y="290" fill="#92400e" font-size="12" font-weight="600">⚠️ IMPORTANT: Failure to pay by Nov 12 will incur a $15.00 late charge and Tier-3 credit review.</text>

  <!-- Detailed Charges Table -->
  <rect x="40" y="320" width="720" height="420" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
  <rect x="40" y="320" width="720" height="40" fill="#f1f5f9" rx="6" />
  <text x="60" y="345" fill="#475569" font-size="13" font-weight="bold">DESCRIPTION OF CHARGES</text>
  <text x="500" y="345" fill="#475569" font-size="13" font-weight="bold">USAGE RATE</text>
  <text x="730" y="345" fill="#475569" font-size="13" font-weight="bold" text-anchor="end">AMOUNT ($)</text>

  <!-- Line Items -->
  <text x="60" y="390" fill="#1e293b" font-size="14" font-weight="500">Tier 1 Baseline Energy Allowance (340 kWh)</text>
  <text x="500" y="390" fill="#64748b" font-size="13">@ $0.218 / kWh</text>
  <text x="730" y="390" fill="#0f172a" font-size="14" font-weight="bold" text-anchor="end">$74.12</text>

  <text x="60" y="430" fill="#1e293b" font-size="14" font-weight="500">Tier 2 Over-Baseline Peak Usage (162 kWh)</text>
  <text x="500" y="430" fill="#64748b" font-size="13">@ $0.462 / kWh</text>
  <text x="730" y="430" fill="#0f172a" font-size="14" font-weight="bold" text-anchor="end">$74.84</text>

  <line x1="60" y1="455" x2="740" y2="455" stroke="#f1f5f9" stroke-width="1" />

  <!-- Confusing / Hidden Fees -->
  <text x="60" y="485" fill="#dc2626" font-size="14" font-weight="600">* Wildfire Hardening System Recovery Rider</text>
  <text x="500" y="485" fill="#64748b" font-size="13">Regulatory Add-on</text>
  <text x="730" y="485" fill="#dc2626" font-size="14" font-weight="bold" text-anchor="end">$16.40</text>

  <text x="60" y="525" fill="#dc2626" font-size="14" font-weight="600">* Public Purpose Program Mandate (AB-32)</text>
  <text x="500" y="525" fill="#64748b" font-size="13">State Fee</text>
  <text x="730" y="525" fill="#dc2626" font-size="14" font-weight="bold" text-anchor="end">$8.75</text>

  <text x="60" y="565" fill="#64748b" font-size="13">Local Municipal Franchise Surcharge</text>
  <text x="500" y="565" fill="#64748b" font-size="13">City Tax</text>
  <text x="730" y="565" fill="#0f172a" font-size="14" font-weight="bold" text-anchor="end">$6.24</text>

  <text x="60" y="605" fill="#64748b" font-size="13">Renewable Energy Adjustment Rider Bal.</text>
  <text x="500" y="605" fill="#64748b" font-size="13">Fixed Charge</text>
  <text x="730" y="605" fill="#0f172a" font-size="14" font-weight="bold" text-anchor="end">$4.30</text>

  <!-- Total Section -->
  <line x1="40" y1="640" x2="760" y2="640" stroke="#cbd5e1" stroke-width="2" />
  <text x="60" y="685" fill="#0f172a" font-size="18" font-weight="bold">NET CURRENT RESIDENTIAL CHARGES</text>
  <text x="730" y="685" fill="#0f172a" font-size="24" font-weight="800" text-anchor="end">$184.65</text>

  <!-- Fine Print Footer -->
  <rect x="40" y="760" width="720" height="190" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
  <text x="60" y="795" fill="#475569" font-size="12" font-weight="bold">DISPUTES &amp; ASSISTANCE:</text>
  <text x="60" y="820" fill="#64748b" font-size="11">If you question any part of this bill, contact customer support at 1-800-555-0199 within 15 days.</text>
  <text x="60" y="840" fill="#64748b" font-size="11">Unresolved complaints may be directed to the State Public Utilities Commission (CPUC), Ref #CP-4091.</text>
  <text x="60" y="870" fill="#991b1b" font-size="12" font-weight="bold">AUTOPAY STATUS: INACTIVE</text>
  <text x="60" y="895" fill="#64748b" font-size="11">Your account is scheduled for manual payment. Make checks payable to Pacific Power &amp; Light.</text>
</svg>
`;

// 2. Japanese Food & Ingredient Label (with hidden allergen)
const japaneseLabelSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900" viewBox="0 0 800 900" style="background:#fff7ed; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Meiryo', sans-serif;">
  <rect width="800" height="110" fill="#14532d" />
  <text x="40" y="60" fill="#86efac" font-size="28" font-weight="bold">贅沢宇治抹茶クリームウエハース</text>
  <text x="40" y="90" fill="#bbf7d0" font-size="15">Tokyo Artisanal Matcha Cream Wafers — 12 Pieces</text>

  <!-- Main Label Container -->
  <rect x="40" y="130" width="720" height="730" rx="8" fill="#ffffff" stroke="#bbf7d0" stroke-width="2" />

  <!-- Ingredients Box -->
  <rect x="65" y="160" width="670" height="230" rx="6" fill="#fcfdfb" stroke="#e2e8f0" stroke-width="1.5" />
  <text x="85" y="195" fill="#166534" font-size="16" font-weight="bold">一括表示 / 食品表示法に基づく表記 (INGREDIENT SPECIFICATION)</text>
  
  <text x="85" y="235" fill="#0f172a" font-size="14" font-weight="bold">【名称】</text>
  <text x="170" y="235" fill="#334155" font-size="14">ウエハース菓子 (Wafer Confectionery)</text>

  <text x="85" y="270" fill="#0f172a" font-size="14" font-weight="bold">【原材料名】</text>
  <text x="170" y="270" fill="#334155" font-size="13">小麦粉（国内製造）、砂糖、ショートニング、全粉乳、乳糖、</text>
  <text x="170" y="295" fill="#dc2626" font-size="14" font-weight="bold">落花生粉末（ピーナッツパウダー 4.2%）、</text>
  <text x="170" y="320" fill="#334155" font-size="13">宇治抹茶、植物油脂、食塩／乳化剤（大豆由来）、香料、着色料（紅花黄、クチナシ）</text>

  <rect x="85" y="340" width="630" height="35" rx="4" fill="#fef2f2" stroke="#fecaca" stroke-width="1" />
  <text x="95" y="363" fill="#b91c1c" font-size="12" font-weight="bold">⚠️ アレルギー物質（特定原材料等28品目中）: 小麦・乳成分・落花生（ピーナッツ）・大豆</text>

  <!-- Date & Expiry -->
  <rect x="65" y="410" width="670" height="110" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
  <text x="85" y="445" fill="#0f172a" font-size="15" font-weight="bold">賞味期限 (BEST BEFORE / EXPIRATION DATE):</text>
  <rect x="85" y="460" width="300" height="45" fill="#0f172a" rx="4" />
  <text x="235" y="492" fill="#38bdf8" font-size="24" font-weight="800" text-anchor="middle">26 . 12 . 04</text>
  <text x="405" y="480" fill="#64748b" font-size="12">※ 年・月・日 表示 (Year 2026, December 4th)</text>
  <text x="405" y="498" fill="#64748b" font-size="11">開封後はお早めにお召し上がりください。(Consume promptly after opening)</text>

  <!-- Nutrition Table -->
  <rect x="65" y="540" width="670" height="170" rx="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
  <text x="85" y="570" fill="#1e293b" font-size="14" font-weight="bold">栄養成分表示 (1包装 3枚当たり / Nutrition per 3 wafers)</text>
  
  <text x="85" y="610" fill="#64748b" font-size="13">エネルギー (Calories): <tspan fill="#0f172a" font-weight="bold">186 kcal</tspan></text>
  <text x="400" y="610" fill="#64748b" font-size="13">たんぱく質 (Protein): <tspan fill="#0f172a" font-weight="bold">2.8 g</tspan></text>

  <text x="85" y="645" fill="#64748b" font-size="13">脂質 (Total Fat): <tspan fill="#0f172a" font-weight="bold">9.4 g (飽和脂肪酸 4.1g)</tspan></text>
  <text x="400" y="645" fill="#64748b" font-size="13">炭水化物 (Carbohydrates): <tspan fill="#0f172a" font-weight="bold">22.4 g</tspan></text>

  <text x="85" y="680" fill="#64748b" font-size="13">食塩相当量 (Sodium Equivalent): <tspan fill="#0f172a" font-weight="bold">0.12 g</tspan></text>

  <!-- Storage instructions -->
  <text x="85" y="740" fill="#475569" font-size="12" font-weight="bold">保存方法: 直射日光・高温多湿を避け、28℃以下の涼しい場所で保存してください。</text>
  <text x="85" y="765" fill="#64748b" font-size="12">製造者: 京都宇治製菓株式会社 〒600-8815 京都府京都市下京区中堂寺1-2</text>
  <text x="85" y="790" fill="#64748b" font-size="12">JANコード: 4901234567890</text>
</svg>
`;

// 3. Apartment Lease Agreement Clause
const leaseAgreementSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="950" viewBox="0 0 800 950" style="background:#ffffff; font-family: 'Times New Roman', Georgia, serif;">
  <!-- Legal Header -->
  <text x="400" y="60" fill="#0f172a" font-size="20" font-weight="bold" text-anchor="middle" letter-spacing="1">STANDARD RESIDENTIAL LEASE AGREEMENT</text>
  <text x="400" y="85" fill="#64748b" font-size="13" text-anchor="middle" font-family="-apple-system, sans-serif">STATE OF CALIFORNIA — MULTI-FAMILY TENANCY ADDENDUM</text>
  <line x1="80" y1="105" x2="720" y2="105" stroke="#0f172a" stroke-width="1.5" />

  <!-- Contract Context -->
  <text x="80" y="140" fill="#334155" font-size="13" font-family="-apple-system, sans-serif">TENANT: Alex M. Chen | PREMISES: Unit 402, 1840 Oakwood Blvd</text>
  <text x="80" y="165" fill="#334155" font-size="13" font-family="-apple-system, sans-serif">LEASE EXPIRATION: December 31, 2026 | MONTHLY BASE RENT: $2,450.00</text>

  <!-- Section 14 highlighted -->
  <rect x="70" y="190" width="660" height="320" rx="4" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5" />
  <text x="95" y="225" fill="#92400e" font-size="16" font-weight="bold">SECTION 14: LEASE RENEWAL, TERMINATION &amp; AUTO-EXTENSIONS</text>

  <text x="95" y="260" fill="#1e293b" font-size="14">14.1 <tspan font-weight="bold">Mandatory Written Notice Period:</tspan> Tenant must provide Landlord written</text>
  <text x="95" y="285" fill="#1e293b" font-size="14">notice of intent to vacate not less than <tspan font-weight="bold" fill="#b91c1c">SIXTY (60) DAYS prior</tspan> to the Lease Expiration</text>
  <text x="95" y="310" fill="#1e293b" font-size="14">Date (Notice must be physically received by Landlord on or before <tspan font-weight="bold" fill="#b91c1c">November 1, 2026</tspan>).</text>
  <text x="95" y="335" fill="#1e293b" font-size="14">Verbal notice or SMS text messaging shall be deemed completely null and void.</text>

  <text x="95" y="375" fill="#1e293b" font-size="14">14.2 <tspan font-weight="bold">Automatic Rollover Clause:</tspan> In the event Tenant fails to deliver said 60-day</text>
  <text x="95" y="400" fill="#1e293b" font-size="14">written notice, this Agreement shall <tspan font-weight="bold" fill="#b91c1c">AUTOMATICALLY RENEW for an additional</tspan></text>
  <text x="95" y="425" fill="#b91c1c" font-size="14" font-weight="bold">twelve (12) month term at an automatic ten percent (10.0%) rate increase</text>
  <text x="95" y="450" fill="#1e293b" font-size="14">($2,695.00/month). Tenant forfeits any right to standard month-to-month conversion.</text>

  <text x="95" y="485" fill="#1e293b" font-size="14">14.3 <tspan font-weight="bold">Early Termination Liquidated Damages:</tspan> Early release requires a fee of 2 full</text>
  <text x="95" y="505" fill="#1e293b" font-size="14">months' rent ($4,900.00) plus complete forfeiture of the Security Deposit.</text>

  <!-- Section 18: Move-out Deductions -->
  <rect x="70" y="530" width="660" height="230" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
  <text x="95" y="565" fill="#0f172a" font-size="16" font-weight="bold">SECTION 18: MANDATORY SECURITY DEPOSIT DEDUCTIONS</text>

  <text x="95" y="600" fill="#334155" font-size="13">Regardless of premise cleanliness or original condition upon move-out,</text>
  <text x="95" y="625" fill="#334155" font-size="13">Tenant agrees that Landlord shall automatically deduct the following non-negotiable</text>
  <text x="95" y="650" fill="#334155" font-size="13">administrative charges from the initial $2,450.00 Security Deposit:</text>

  <text x="120" y="685" fill="#b91c1c" font-size="13" font-weight="bold">• Mandatory Professional Carpet Steam Sanitization: $350.00</text>
  <text x="120" y="710" fill="#b91c1c" font-size="13" font-weight="bold">• Rekeying and RFID Keycard Reset Administration Fee: $125.00</text>
  <text x="120" y="735" fill="#b91c1c" font-size="13" font-weight="bold">• Touch-up Primer &amp; Paint Supply Fee: $180.00</text>

  <!-- Signature area -->
  <line x1="80" y1="800" x2="350" y2="800" stroke="#94a3b8" stroke-width="1" />
  <text x="80" y="825" fill="#64748b" font-size="12" font-family="-apple-system, sans-serif">Tenant Signature / Date</text>

  <line x1="450" y1="800" x2="720" y2="800" stroke="#94a3b8" stroke-width="1" />
  <text x="450" y="825" fill="#64748b" font-size="12" font-family="-apple-system, sans-serif">Authorized Property Manager / Date</text>
</svg>
`;

// 4. Suspicious Bank SMS Message (Phishing Verification)
const bankSmsSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900" viewBox="0 0 800 900" style="background:#090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Phone Frame Simulator -->
  <rect x="60" y="40" width="680" height="820" rx="40" fill="#0f172a" stroke="#334155" stroke-width="3" />
  
  <!-- Status Bar -->
  <text x="110" y="90" fill="#f8fafc" font-size="16" font-weight="bold">9:41 AM</text>
  <text x="690" y="90" fill="#f8fafc" font-size="14" text-anchor="end">5G  100% 🔋</text>

  <!-- SMS Header -->
  <circle cx="400" cy="150" r="32" fill="#1e293b" />
  <text x="400" y="158" fill="#38bdf8" font-size="20" font-weight="bold" text-anchor="middle">🏦</text>
  <text x="400" y="210" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">+1 (844) 912-0881</text>
  <text x="400" y="235" fill="#94a3b8" font-size="13" text-anchor="middle">Text Message • Today 9:38 AM</text>

  <!-- SMS Bubble (Urgent / Scam Phishing) -->
  <rect x="110" y="270" width="580" height="280" rx="18" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
  
  <text x="140" y="315" fill="#f87171" font-size="16" font-weight="bold">🚨 CHASE-FRAUD-ALERT #9021:</text>
  
  <text x="140" y="350" fill="#f1f5f9" font-size="15">A pending debit charge of <tspan fill="#facc15" font-weight="bold">$489.99 at APPLE STORE ONLINE</tspan></text>
  <text x="140" y="380" fill="#f1f5f9" font-size="15">was flagged on your checking account ending in <tspan font-weight="bold">...4109</tspan>.</text>

  <text x="140" y="425" fill="#f1f5f9" font-size="15">If this was NOT you, you must cancel immediately</text>
  <text x="140" y="455" fill="#f1f5f9" font-size="15">within 15 minutes to prevent account lock:</text>

  <text x="140" y="500" fill="#38bdf8" font-size="16" font-weight="bold" text-decoration="underline">👉 http://chase-security-resolver.cc/auth</text>
  <text x="140" y="530" fill="#94a3b8" font-size="12">Reply STOP to unsubscribe. Msg &amp; data rates may apply.</text>

  <!-- User Reply Draft -->
  <rect x="110" y="580" width="580" height="60" rx="16" fill="#0f172a" stroke="#475569" stroke-width="1" />
  <text x="140" y="615" fill="#94a3b8" font-size="14">iMessage or Text Message...</text>

  <!-- Warning overlay box for user understanding -->
  <rect x="110" y="670" width="580" height="150" rx="12" fill="#450a0a" stroke="#b91c1c" stroke-width="2" />
  <text x="140" y="705" fill="#fecaca" font-size="14" font-weight="bold">🔍 LENS SUSPICION INDICATORS:</text>
  <text x="140" y="735" fill="#fee2e2" font-size="13">• Domain is ".cc" (Cocos Islands), NOT official chase.com domain.</text>
  <text x="140" y="760" fill="#fee2e2" font-size="13">• Creates artificial 15-minute panic timer to bypass logical scrutiny.</text>
  <text x="140" y="785" fill="#fee2e2" font-size="13">• Genuine banks never ask you to authenticate credentials via unverified HTTP link.</text>
</svg>
`;

// 5. Appliance / Coffee Maker Troubleshooting Manual
const applianceManualSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="920" viewBox="0 0 800 920" style="background:#f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <rect width="800" height="100" fill="#1e293b" />
  <text x="40" y="55" fill="#ffffff" font-size="24" font-weight="bold">BARISTA PRO ESPRESSO SYSTEM — OWNER'S GUIDE</text>
  <text x="40" y="80" fill="#94a3b8" font-size="13">Section 7: Diagnostics, Fault Indicators &amp; Error Codes</text>

  <rect x="40" y="120" width="720" height="140" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5" />
  <circle cx="85" cy="190" r="28" fill="#2563eb" />
  <text x="85" y="198" fill="#ffffff" font-size="22" font-weight="bold" text-anchor="middle">⚙️</text>
  <text x="135" y="165" fill="#1e40af" font-size="18" font-weight="bold">ERROR CODE: E-04 (HIGH PRESSURE HYDRAULIC LOCK)</text>
  <text x="135" y="195" fill="#334155" font-size="14">Alarm triggers when internal boiler sensor exceeds 15.5 bars of hydrostatic backpressure.</text>
  <text x="135" y="225" fill="#b91c1c" font-size="13" font-weight="bold">⚠️ DO NOT FORCE STEAM WAND LEVER WHILE E-04 IS FLASHING TO AVOID HOT SCALD RISK.</text>

  <!-- Troubleshooting Steps Matrix -->
  <rect x="40" y="280" width="720" height="460" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
  <rect x="40" y="280" width="720" height="40" fill="#f1f5f9" rx="8" />
  <text x="65" y="305" fill="#475569" font-size="13" font-weight="bold">STEP</text>
  <text x="140" y="305" fill="#475569" font-size="13" font-weight="bold">CAUSE DIAGNOSED</text>
  <text x="420" y="305" fill="#475569" font-size="13" font-weight="bold">REQUIRED RESOLUTION ACTION</text>

  <!-- Step 1 -->
  <circle cx="85" cy="355" r="14" fill="#3b82f6" />
  <text x="85" y="360" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">1</text>
  <text x="140" y="350" fill="#0f172a" font-size="14" font-weight="600">Ultra-fine Coffee Grind</text>
  <text x="140" y="370" fill="#64748b" font-size="12">Water cannot permeate puck</text>
  <text x="420" y="350" fill="#334155" font-size="13">Switch grinder dial from #1-2 to coarser setting (#4-6).</text>
  <text x="420" y="370" fill="#64748b" font-size="12">Discard existing compressed filter basket puck.</text>

  <line x1="65" y1="400" x2="735" y2="400" stroke="#f1f5f9" stroke-width="1" />

  <!-- Step 2 -->
  <circle cx="85" cy="445" r="14" fill="#3b82f6" />
  <text x="85" y="450" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">2</text>
  <text x="140" y="440" fill="#0f172a" font-size="14" font-weight="600">Mineral Scale Calcification</text>
  <text x="140" y="460" fill="#64748b" font-size="12">Calcium buildup in thermocoil</text>
  <text x="420" y="435" fill="#334155" font-size="13">Perform emergency cold descaling flush:</text>
  <text x="420" y="455" fill="#334155" font-size="13">Mix 1 part food-grade citric acid with 3 parts filtered water.</text>
  <text x="420" y="475" fill="#0284c7" font-size="12" font-weight="bold">Hold [POWER] + [2-CUP] buttons for 5 seconds to bypass pump lock.</text>

  <line x1="65" y1="510" x2="735" y2="510" stroke="#f1f5f9" stroke-width="1" />

  <!-- Step 3 -->
  <circle cx="85" cy="555" r="14" fill="#3b82f6" />
  <text x="85" y="560" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">3</text>
  <text x="140" y="550" fill="#0f172a" font-size="14" font-weight="600">Shower Screen Clogging</text>
  <text x="140" y="570" fill="#64748b" font-size="12">Coffee oil polymer film</text>
  <text x="420" y="550" fill="#334155" font-size="13">Use supplied Allen key (size 4mm) to unscrew screen.</text>
  <text x="420" y="570" fill="#64748b" font-size="12">Soak in warm detergent bath for 15 minutes and wipe dry.</text>

  <!-- Warranty Warning -->
  <rect x="40" y="760" width="720" height="120" rx="8" fill="#fef2f2" stroke="#fecaca" stroke-width="1" />
  <text x="65" y="795" fill="#991b1b" font-size="13" font-weight="bold">WARRANTY EXCLUSION NOTE (§ 11.4):</text>
  <text x="65" y="820" fill="#7f1d1d" font-size="12">Failure to descale your machine every 90 days voids the 2-year heating element warranty.</text>
  <text x="65" y="845" fill="#7f1d1d" font-size="12">Replacement solenoids are billed at $85.00 plus labor if scale-induced damage is verified by technicians.</text>
</svg>
`;

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'sample-electric-bill',
    name: 'Electric Utility Bill',
    category: 'bill',
    tagline: 'Spot hidden surcharges & the penalty due date',
    badge: 'Confusing Fees',
    thumbnail: '⚡',
    dataUrl: svgToDataUrl(electricBillSvg),
    userNotes: 'Why is my bill $184.65 this month and what are these wildfire riders?',
  },
  {
    id: 'sample-japanese-label',
    name: 'Imported Japanese Snack',
    category: 'label',
    tagline: 'Decodes kanji ingredients, allergens & expiry date format',
    badge: 'Allergen Alert',
    thumbnail: '🍙',
    dataUrl: svgToDataUrl(japaneseLabelSvg),
    userNotes: 'Check if this has peanuts or dairy, and what date 26.12.04 means.',
  },
  {
    id: 'sample-lease-clause',
    name: 'Apartment Lease Agreement',
    category: 'document',
    tagline: 'Reveals the 60-day auto-renewal trap and non-refundable deposit fees',
    badge: 'Legal Fine Print',
    thumbnail: '🏢',
    dataUrl: svgToDataUrl(leaseAgreementSvg),
    userNotes: 'What happens if I forget to notify them before November 1st?',
  },
  {
    id: 'sample-bank-sms',
    name: 'Suspicious Bank SMS Alert',
    category: 'message',
    tagline: 'Detects phishing domain, urgent psychological panic, and spoofed ID',
    badge: 'Scam Detection',
    thumbnail: '⚠️',
    dataUrl: svgToDataUrl(bankSmsSvg),
    userNotes: 'Is this real or a phishing scam? Should I click the link?',
  },
  {
    id: 'sample-coffee-machine',
    name: 'Espresso Maker Error E-04',
    category: 'instruction',
    tagline: 'Translates cryptic error codes into plain 3-step fix',
    badge: 'Tech Manual',
    thumbnail: '☕',
    dataUrl: svgToDataUrl(applianceManualSvg),
    userNotes: 'My espresso machine is beeping with E-04 and won’t brew. How do I fix it?',
  },
];
