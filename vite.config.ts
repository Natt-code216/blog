import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Keep the existing /mini-tools/*.html URLs while bundling their shared code.
const toolPages = readdirSync(resolve(__dirname, 'mini-tools'))
  .filter(file => file.endsWith('.html'))
  .map(file => [`tools/${file.replace('.html', '')}`, resolve(__dirname, 'mini-tools', file)])

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), ...Object.fromEntries(toolPages) },
    },
  },
})
