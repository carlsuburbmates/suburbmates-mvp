import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { promisify } from 'node:util'
import { exec as execCb } from 'node:child_process'
const exec = promisify(execCb)
const server = new McpServer({
  name: 'typescript-diagnostics',
  version: '0.1.0',
})
server.registerTool(
  'tsc-check',
  {
    title: 'TypeScript Project Check',
    description: 'Run tsc --noEmit and return diagnostics summary',
    inputSchema: {
      project: z.string().default('tsconfig.json'),
      args: z.array(z.string()).optional(),
    },
    outputSchema: {
      exitCode: z.number(),
      errorCount: z.number(),
      output: z.string(),
    },
  },
  async ({ project, args = [] }) => {
    const cmd = `npx tsc -p ${project} --noEmit ${args.join(' ')}`.trim()
    try {
      const { stdout, stderr } = await exec(cmd)
      const text = stdout || stderr || ''
      const errorCount = (text.match(/error TS\d+/g) || []).length
      return {
        content: [{ type: 'text', text }],
        structuredContent: { exitCode: 0, errorCount, output: text },
      }
    } catch (err) {
      const e = err
      const text = (e.stdout || '') + (e.stderr || '') || String(err)
      const errorCount = (text.match(/error TS\d+/g) || []).length
      return {
        content: [{ type: 'text', text }],
        structuredContent: {
          exitCode: typeof e.code === 'number' ? e.code : 1,
          errorCount,
          output: text,
        },
      }
    }
  }
)
server.registerTool(
  'eslint-lint',
  {
    title: 'ESLint Lint',
    description: 'Run ESLint and return JSON results',
    inputSchema: {
      target: z.string().default('.'),
      args: z.array(z.string()).optional(),
    },
    outputSchema: {
      totalProblems: z.number(),
      errors: z.number(),
      warnings: z.number(),
      results: z.any(),
      raw: z.string(),
    },
  },
  async ({ target, args = [] }) => {
    const cmd = `npx eslint ${target} --format json ${args.join(' ')}`.trim()
    try {
      const { stdout } = await exec(cmd)
      const raw = stdout
      let results = []
      try {
        results = JSON.parse(raw)
      } catch {
        // Some ESLint versions output non-JSON when there are config errors
        return {
          content: [{ type: 'text', text: raw }],
          structuredContent: {
            totalProblems: 0,
            errors: 0,
            warnings: 0,
            results: [],
            raw,
          },
        }
      }
      const totals = results.reduce(
        (acc, r) => {
          acc.errors += r.errorCount || 0
          acc.warnings += r.warningCount || 0
          return acc
        },
        { errors: 0, warnings: 0 }
      )
      const totalProblems = totals.errors + totals.warnings
      return {
        content: [
          {
            type: 'text',
            text: `Problems: ${totalProblems} (errors: ${totals.errors}, warnings: ${totals.warnings})`,
          },
        ],
        structuredContent: {
          totalProblems,
          errors: totals.errors,
          warnings: totals.warnings,
          results,
          raw,
        },
      }
    } catch (err) {
      const e = err
      const raw = (e.stdout || '') + (e.stderr || '') || String(err)
      let results = []
      try {
        results = JSON.parse(raw)
      } catch {
        // return raw text if JSON parse fails
        return {
          content: [{ type: 'text', text: raw }],
          structuredContent: {
            totalProblems: 0,
            errors: 0,
            warnings: 0,
            results: [],
            raw,
          },
        }
      }
      const totals = results.reduce(
        (acc, r) => {
          acc.errors += r.errorCount || 0
          acc.warnings += r.warningCount || 0
          return acc
        },
        { errors: 0, warnings: 0 }
      )
      const totalProblems = totals.errors + totals.warnings
      return {
        content: [
          {
            type: 'text',
            text: `Problems: ${totalProblems} (errors: ${totals.errors}, warnings: ${totals.warnings})`,
          },
        ],
        structuredContent: {
          totalProblems,
          errors: totals.errors,
          warnings: totals.warnings,
          results,
          raw,
        },
      }
    }
  }
)
const transport = new StdioServerTransport()
async function start() {
  await server.connect(transport)
}
void start()
