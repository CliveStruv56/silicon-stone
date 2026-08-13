// Shim for the `server-only` package, shared by every CLI script.
//
// Several src/lib modules (pinecone, embeddings, sanity, exa) start with
// `import 'server-only'`, which throws when evaluated outside a Next.js server
// bundle. Any script that reuses those modules under plain `tsx` must therefore
// run with scripts/tsconfig.scripts.json, which maps the `server-only`
// specifier here. The website still resolves the real package.
//
// scripts/local-draft/ keeps its own copy because it has its own tsconfig; both
// are the same empty module.
export {}
