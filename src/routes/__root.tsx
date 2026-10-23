import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '../styles.css?url'

const description =
	'A physics-and-anagram arcade game: sink letter balls for points, bank the ones you want, then spell as many words as you can.'

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ title: 'Wordball' },
			{ name: 'description', content: description },
			{ name: 'theme-color', content: '#0b0f1f' },
			{ property: 'og:title', content: 'Wordball' },
			{ property: 'og:description', content: description },
		],
		links: [
			{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
			{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
			{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
			{
				rel: 'stylesheet',
				href: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;500;700&display=swap',
			},
			{ rel: 'stylesheet', href: appCss },
		],
	}),
	component: RootLayout,
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	)
}

function RootLayout() {
	return (
		<div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4">
			<header className="flex items-center justify-between py-4">
				<Link to="/" className="font-display text-sm text-cyan sm:text-base">
					WORD<span className="text-magenta">BALL</span>
				</Link>
				<nav className="flex gap-4 text-sm font-medium text-muted">
					<Link to="/leaderboard" className="hover:text-ink [&.active]:text-ink">
						Leaderboard
					</Link>
					<Link to="/about" className="hover:text-ink [&.active]:text-ink">
						Then &amp; now
					</Link>
				</nav>
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
			<footer className="py-6 text-center text-xs text-muted">
				Built by{' '}
				<a className="underline hover:text-ink" href="https://johndennehy.dev">
					John Dennehy
				</a>{' '}
				·{' '}
				<a className="underline hover:text-ink" href="https://github.com/John-Dennehy/wordball">
					Source on GitHub
				</a>
			</footer>
		</div>
	)
}

function NotFound() {
	return (
		<div className="py-24 text-center">
			<p className="font-display text-gold">OUT OF BOUNDS</p>
			<p className="mt-4 text-muted">That page flew over the top.</p>
			<Link to="/" className="btn-secondary mt-8">
				Back to the start
			</Link>
		</div>
	)
}
