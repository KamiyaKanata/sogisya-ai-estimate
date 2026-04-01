import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import ConvexClientProvider from '@/components/ConvexClientProvider'

export const metadata: Metadata = {
  title: '葬儀社 AI見積もりアシスタント',
  description: '葬儀社向けAI見積もり・書類生成システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <ConvexClientProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto min-h-screen">{children}</main>
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
