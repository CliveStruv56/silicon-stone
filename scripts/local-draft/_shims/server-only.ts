// Shim for the `server-only` package.
//
// Several src/lib modules (sanity, exa, pinecone, embeddings) start with
// `import 'server-only'`, which throws when evaluated outside a Next.js server
// bundle. This local drafting pipeline reuses those modules under plain `tsx`,
// so scripts/local-draft/tsconfig.json maps the `server-only` specifier to this
// empty module. It is only ever used by this local pipeline — the website still
// resolves the real package.
export {}
