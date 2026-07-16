import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Award,
  Book,
  BookOpen,
  Bolt,
  Brain,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Diamond,
  Edit,
  Eye,
  EyeOff,
  Fingerprint,
  Flame,
  Home,
  ListChecks,
  Lock,
  LockOpen,
  LogOut,
  Medal,
  Moon,
  Radio,
  ScrollText,
  Search,
  Send,
  Settings,
  Shield,
  Star,
  Sun,
  Timer,
  TrendingUp,
  Trophy,
  X,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Maps Stitch Material Symbols names → Lucide icons.
 *
 * Root cause of junk text: Material Symbols ligature names (e.g. "psychology")
 * rendered as plain text because the font never applied (CSS lacked font-family
 * and Google Fonts @import was unreliable in Next/Tailwind builds).
 *
 * Lucide is bundled with the app — works offline / PWA.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  // Nav
  home: Home,
  history_edu: ScrollText,
  task_alt: ListChecks,
  shield_with_heart: Shield,
  book: Book,
  psychology: Brain,
  leaderboard: Trophy,
  trending_up: TrendingUp,
  calendar_today: Calendar,
  fingerprint: Fingerprint,
  settings: Settings,
  rebase_edit: Edit,
  menu_book: BookOpen,
  logout: LogOut,

  // UI chrome
  close: X,
  arrow_back: ArrowLeft,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  chevron_down: ChevronRight,
  expand_more: ChevronRight,
  expand_less: ChevronLeft,
  north_east: ArrowUpRight,
  send: Send,
  edit: Edit,
  search: Search,
  photo_camera: Camera,
  timer: Timer,
  sensors: Radio,
  visibility: Eye,
  visibility_off: EyeOff,

  // Status / metrics
  lock: Lock,
  lock_open: LockOpen,
  check: Check,
  check_circle: CheckCircle2,
  warning: AlertTriangle,
  local_fire_department: Flame,
  whatshot: Flame,
  monitoring: CircleDot,
  wb_sunny: Sun,
  nightlight: Moon,
  bolt: Bolt,
  star: Star,
  diamond: Diamond,
  military_tech: Medal,
  emoji_events: Trophy,
  workspace_premium: Award,

  // Fallbacks
  account_circle: Fingerprint,
  hub: CircleDot,
  language: CircleDot,
}

/**
 * Dashboard icon primitive. Prefer this over Material Symbols spans.
 */
export function Icon({
  name,
  filled,
  className,
  size,
  style,
  ...rest
}: {
  name: string
  filled?: boolean
  className?: string
  size?: number | string
  style?: React.CSSProperties
} & Omit<LucideProps, 'ref' | 'size' | 'className' | 'style'>) {
  const Cmp = ICON_MAP[name] ?? CircleDot
  const numericSize =
    typeof size === 'number'
      ? size
      : typeof size === 'string' && size.endsWith('px')
        ? parseInt(size, 10)
        : undefined

  // Use em-based box so Tailwind text-* (text-lg / text-4xl) scales icons.
  // Only force pixel size when `size` is passed explicitly.
  return (
    <Cmp
      aria-hidden
      size={numericSize}
      strokeWidth={filled ? 2.25 : 1.75}
      absoluteStrokeWidth
      className={cn(
        // text-current: stroke/fill follow parent ink (black on lime CTAs, light on dark)
        'inline-block shrink-0 text-current',
        numericSize == null && 'h-[1.25em] w-[1.25em]',
        className,
      )}
      style={style}
      {...rest}
    />
  )
}
