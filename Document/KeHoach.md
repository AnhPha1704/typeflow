# TypeFlow — Kế hoạch phát triển (đã cập nhật)

TypeFlow là web app kiểm tra tốc độ gõ phím **desktop-only**, dùng bài văn từ Wikipedia. Stack: **Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript**.

---

## Quyết định đã chốt

| Vấn đề | Quyết định |
|--------|-----------|
| Nền tảng | **Desktop only** — không cần responsive mobile |
| Thứ tự | Bắt đầu từ **Giai đoạn 1 (Refactor)** |
| Tính năng G2 ưu tiên | **WPM Chart** |
| Theme | Giữ nguyên **Sage Forest** duy nhất, không tuỳ chỉnh |
| Âm thanh | Không làm |
| Tài khoản | Có, nhưng **không bắt buộc** — guest vẫn dùng bình thường |

---

## Trạng thái hiện tại

### Đã có ✅
- Layout 3-cột (sidebar wiki | vùng gõ | lịch sử)
- Bộ đếm thời gian 15 / 30 / 60 giây
- Đa ngôn ngữ: vi / en / ja (Wikipedia API)
- Caret di chuyển theo ký tự (position tracking)
- Màu ký tự: đúng / sai / chưa gõ
- Lịch sử phiên lưu localStorage (tối đa 6)
- Màn hình kết quả (WPM + ACC + Chars)
- Design tokens "Sage Forest"
- `prefers-reduced-motion` đã xử lý

### Vấn đề cần sửa ⚠️
- Toàn bộ ~490 dòng logic trong 1 file `page.tsx`
- Caret chưa auto-scroll khi xuống dòng mới
- Chưa có WPM timeline (chỉ có WPM cuối cùng)
- Chưa có chế độ văn bản khác (chỉ Wikipedia)
- Chưa có tài khoản người dùng

---

## Kiến trúc mục tiêu

```
typeflow/
├── app/
│   ├── layout.tsx                    # Root layout + providers
│   ├── page.tsx                      # Home — compose components, gọi hooks
│   ├── globals.css                   # Design tokens + Tailwind v4
│   ├── history/page.tsx              # [G3] Lịch sử chi tiết
│   └── (auth)/
│       ├── login/page.tsx            # [G3] Đăng nhập
│       └── register/page.tsx         # [G3] Đăng ký
│
├── components/
│   ├── TypingTest/
│   │   ├── index.tsx                 # Container chính
│   │   ├── TypingArea.tsx            # Vùng gõ + caret
│   │   ├── CharacterDisplay.tsx      # Render từng ký tự
│   │   ├── Caret.tsx                 # Caret animation
│   │   ├── Controls.tsx              # Tab time / lang / mode
│   │   ├── LiveMetrics.tsx           # WPM + ACC + Timer bar
│   │   ├── ResultScreen.tsx          # Màn hình kết quả
│   │   └── WpmChart.tsx              # [G2] Biểu đồ WPM timeline
│   │
│   ├── Sidebar/
│   │   ├── WikiCard.tsx              # Card thông tin Wikipedia
│   │   └── HistoryPanel.tsx          # Panel lịch sử sessions
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── TabGroup.tsx
│       ├── Kbd.tsx
│       └── Metric.tsx
│
├── hooks/
│   ├── useTypingTest.ts              # Core: input, timer, scoring
│   ├── useCaretPosition.ts           # Caret tracking + scroll
│   ├── useHistory.ts                 # localStorage CRUD
│   └── useKeyboardShortcuts.ts       # ESC shortcut
│
├── lib/
│   ├── scoring.ts                    # calcWPM, calcAccuracy (pure)
│   ├── textSources.ts                # Wikipedia + [G2] Quotes/Words
│   └── constants.ts                  # LANGS, DURATIONS, MODES
│
└── utils/
    └── fetchWikiText.ts              # Đã có
```

---

## Giai đoạn 1 — Refactor & Nền tảng (Bắt đầu ngay)

> **Mục tiêu:** Tách code, không thêm tính năng mới. Kết quả: codebase sạch, dễ mở rộng.

### 1.1 Tách Custom Hooks

#### [NEW] `hooks/useTypingTest.ts`
State và logic chính:
```ts
// Expose:
{ userInput, isStarted, finished, stats, timeLeft, wikiData, loading,
  handleInput, endTest, load }
```

#### [NEW] `hooks/useCaretPosition.ts`
```ts
// Expose: caretPos ({ left, top, height })
// Fix: scrollIntoView khi caret xuống dòng mới
```

#### [NEW] `hooks/useHistory.ts`
```ts
// Expose: history, addEntry(entry)
// Xử lý: localStorage read/write, slice(0, 6)
```

#### [NEW] `hooks/useKeyboardShortcuts.ts`
```ts
// Expose: không — chỉ side effect
// Xử lý: ESC → load(), click anywhere → focus
```

### 1.2 Tách Components

| File mới | Tách từ |
|----------|---------|
| `components/TypingTest/TypingArea.tsx` | `sk-typing` div + caret + CharacterDisplay |
| `components/TypingTest/CharacterDisplay.tsx` | `characters.map()` vòng lặp + class màu |
| `components/TypingTest/Caret.tsx` | `sk-caret` div |
| `components/TypingTest/LiveMetrics.tsx` | WPM/ACC/timer bar khi đang gõ |
| `components/TypingTest/Controls.tsx` | Tab groups (time, lang) + nút Restart |
| `components/TypingTest/ResultScreen.tsx` | Màn hình kết quả ở cuối `page.tsx` |
| `components/Sidebar/HistoryPanel.tsx` | Right sidebar lịch sử |
| `components/ui/TabGroup.tsx` | `.sk-tab-group` / `.sk-tab` |
| `components/ui/Kbd.tsx` | `.sk-kbd` |
| `components/ui/Metric.tsx` | `.sk-metric` / `.sk-val` / `.sk-label` |

### 1.3 Tạo Pure Functions

#### [NEW] `lib/scoring.ts`
```ts
export function calcWPM(correctChars: number, elapsedMs: number): number
export function calcAccuracy(input: string, target: string): number
```

#### [NEW] `lib/constants.ts`
```ts
export const LANGS = ['vi', 'en', 'ja'] as const
export const DURATIONS = [15, 30, 60] as const
export const SHORTCUTS = [...] as const
```

### 1.4 Fix UX nhỏ

- **Caret auto-scroll**: khi gõ tới dòng dưới, vùng text tự cuộn để caret luôn hiển thị
- **Tab key trong typing**: bắt `Tab` → focus textarea (không nhảy ra ngoài DOM)

### 1.5 Kết quả `page.tsx` sau refactor

```tsx
// ~60–80 dòng, chỉ compose:
export default function Home() {
  const typing   = useTypingTest()
  const caret    = useCaretPosition(...)
  const history  = useHistory()
  useKeyboardShortcuts(...)

  return (
    <div>
      <WikiCard />
      <TypingTest {...typing} caret={caret} />
      <HistoryPanel history={history.entries} />
    </div>
  )
}
```

---

## Giai đoạn 2 — WPM Chart & Text Modes

### 2.1 WPM Timeline Chart ⭐ (Ưu tiên cao nhất)

**Nguyên lý**: Ghi lại WPM mỗi giây trong quá trình test → vẽ biểu đồ trong `ResultScreen`.

#### Thay đổi data model

```ts
interface HistoryEntry {
  wpm:         number;
  acc:         number;
  date:        string;
  duration:    number;      // +mới
  lang:        string;      // +mới
  mode:        string;      // +mới
  wpmTimeline: number[];    // +mới — WPM mỗi giây
}
```

#### `useTypingTest.ts` — thêm timeline tracking

```ts
// Trong timer interval:
const elapsed = (Date.now() - startTime) / 1000
const currentWpm = calcWPM(correctChars, elapsed)
setWpmTimeline(prev => [...prev, currentWpm])
```

#### [NEW] `components/TypingTest/WpmChart.tsx`

- Dùng **Canvas API thuần** (không cần thư viện Chart.js)
- Chart line chart: trục X = giây, trục Y = WPM
- Nền tối, stroke màu accent `#D7F9FA`
- Hiển thị trong `ResultScreen` bên dưới số liệu
- Đường trung bình mờ (average line)
- Tooltip khi hover vào điểm

```
ResultScreen sau G2:
┌─────────────────────────────┐
│    TEST COMPLETE            │
│                             │
│  [  142  WPM  ]             │
│  Accuracy 96%  Chars 215   │
│                             │
│  ╭── WPM per second ───╮   │
│  │     ∿∿∿∿∿∿∿         │   │
│  │   ∿∿       ∿∿∿∿∿   │   │
│  ╰─────────────────────╯   │
│                             │
│       [ Try Again → ]       │
└─────────────────────────────┘
```

### 2.2 Chế độ văn bản (Text Mode)

Thêm selector: `[Wikipedia]  [Quotes]  [Words]`

| Mode | Nguồn dữ liệu | Ghi chú |
|------|--------------|---------|
| **Wikipedia** | API hiện tại | Giữ nguyên |
| **Quotes** | `lib/quotes.json` ~150 câu | Tiếng Anh / Tiếng Việt |
| **Top Words** | `lib/words.json` (top 200 từ) | Ngẫu nhiên ghép ~100 từ |

**Không làm**: Custom text (user paste) — giữ đơn giản.

### 2.3 Thống kê hiển thị nâng cao trong HistoryPanel

- Hiển thị `duration` + `lang` + `mode` trong mỗi history card
- Mini sparkline (5-6 điểm) trong history card

---

## Giai đoạn 3 — Tài khoản người dùng (Tùy chọn)

> Guest vẫn dùng đầy đủ tính năng. Tài khoản chỉ thêm: lưu cloud, leaderboard.

### Nguyên tắc thiết kế

```
┌─────────────────────────────────────────┐
│  Guest mode:                            │
│  • Dùng tất cả tính năng               │
│  • Lịch sử lưu localStorage (6 phiên)  │
│  • Không leaderboard                    │
│                                         │
│  Logged-in mode:                        │
│  • Lịch sử lưu cloud (không giới hạn)  │
│  • Trang /history đầy đủ               │
│  • Leaderboard toàn cầu                │
│  • Profile page                         │
└─────────────────────────────────────────┘
```

### Công nghệ đề xuất

| Phần | Lựa chọn | Lý do |
|------|----------|-------|
| Auth | **NextAuth.js v5** | Tích hợp tốt Next.js 16, hỗ trợ Google/GitHub OAuth |
| DB | **PostgreSQL + Prisma** | Type-safe, dễ migrate |
| Host DB | **Supabase** (free tier) | Không cần tự quản lý server |

### Cấu trúc bổ sung G3

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── history/page.tsx        # Bảng lịch sử đầy đủ + WPM trend chart
└── leaderboard/page.tsx    # Bảng xếp hạng

lib/
├── auth.ts                 # NextAuth config
└── db/
    ├── schema.prisma
    └── queries.ts
```

---

## Verification Plan

### Giai đoạn 1
- `npm run dev` không lỗi TypeScript
- Typing test hoạt động y hệt như trước refactor
- Lịch sử lưu/đọc đúng từ localStorage
- ESC → reset phiên
- Caret không bị lạc khi gõ nhiều dòng
- Tab key focus đúng vào textarea

### Giai đoạn 2
- WPM timeline ghi đủ điểm theo giây
- Chart render đúng tỷ lệ trên canvas
- Chuyển mode Wikipedia → Quotes → Words hoạt động

### Giai đoạn 3
- Guest không bị chặn bất kỳ tính năng nào
- Đăng nhập Google/GitHub OAuth thành công
- Lịch sử đồng bộ cloud sau login
