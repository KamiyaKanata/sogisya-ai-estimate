'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard',       label: 'ダッシュボード', icon: '▦' },
  { href: '/estimate/new',    label: '見積もり作成',   icon: '＋' },
  { href: '/documents',       label: '書類生成',       icon: '📄' },
  { href: '/settlement',      label: '精算・請求',     icon: '¥' },
  { href: '/kouden',          label: '香典帳',         icon: '≡' },
  { href: '/procedures',      label: '手続きリスト',   icon: '✓' },
  { href: '/admin/products',  label: '商品マスタ',     icon: '⚙' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-[#2B3A4E] flex flex-col shrink-0 no-print">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#B8860B] rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">葬</span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">AI見積もり</p>
            <p className="text-white/50 text-xs">アシスタント</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {navItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              item.href !== '/estimate/new' &&
              pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-[#B8860B] text-white font-medium'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="w-4 text-center text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10">
        <p className="text-white/30 text-xs">© 2026 葬儀社AI</p>
      </div>
    </aside>
  )
}
