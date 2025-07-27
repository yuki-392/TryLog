import './globals.css'
import Header from '@/components/header'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'TryLog',
  description: '努力を記録するSNSアプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900">
        <Header />
        <main className="container mx-auto p-4">
          <>
          {children}
          <Toaster richColors />
          </>
        </main>
      </body>
    </html>
  )
}
