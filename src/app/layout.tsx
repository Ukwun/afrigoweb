import './globals.css'
import Header from '../components/Header'

export const metadata = {
  title: 'Afrigo',
  description: 'Afrigo - Digital Trade Operating System'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="h-full bg-[var(--afrigo-bg)] text-[var(--afrigo-text)]">
        <Header />
        <main className="container mx-auto p-6">{children}</main>
      </body>
    </html>
  )
}
