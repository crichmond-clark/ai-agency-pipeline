# Next.js and Payload own screenshot capture initially

Screenshot capture starts in the Next.js/Payload application using Playwright rather than in the Python AI Service. Screenshots are taken from rendered `/demo/[slug]` pages and are not inherently AI work, so keeping them near rendering and media storage is simpler; a separate screenshot worker can be introduced later if hosting or runtime constraints make Playwright difficult.
