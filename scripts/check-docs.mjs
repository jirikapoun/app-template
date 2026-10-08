// checks that the relative links in the Markdown files of the project point to existing files and headings
import fs from 'node:fs'
import path from 'node:path'


const IGNORED_DIRECTORY = /(?:^|[\\/])(?:node_modules|dist|\.[^\\/]+)$/u
const LINK = /\[[^\]]*\]\((?<target>[^)\s]+)(?:\s+"[^"]*")?\)/gu
const HEADING = /^#{1,6}\s+(?<heading>.+)$/gmu
const EXTERNAL = /^[a-z][\d+.a-z-]*:/iu

// links and headings in code blocks are just code
const stripCodeBlocks = markdown => markdown.replace(/^```[\s\S]*?^```/gmu, '')

// the anchor GitHub generates for a heading
const toAnchor = heading => heading
  .toLowerCase()
  .replace(/[^\p{L}\p{N}\s_-]/gu, '')
  .replace(/\s/gu, '-')

const anchorCache = new Map()

const getAnchors = file => {
  if (!anchorCache.has(file)) {
    const anchors = new Set()
    for (const match of stripCodeBlocks(fs.readFileSync(file, 'utf8')).matchAll(HEADING)) {
      const anchor = toAnchor(match.groups.heading.trim())
      let uniqueAnchor = anchor
      for (let index = 1; anchors.has(uniqueAnchor); index++) {
        uniqueAnchor = `${anchor}-${index}`
      }
      anchors.add(uniqueAnchor)
    }
    anchorCache.set(file, anchors)
  }
  return anchorCache.get(file)
}

const files = fs.globSync('**/*.md', {
  exclude: entry => IGNORED_DIRECTORY.test(typeof entry === 'string' ? entry : entry.name),
})

const problems = []
for (const file of files) {
  for (const match of stripCodeBlocks(fs.readFileSync(file, 'utf8')).matchAll(LINK)) {
    const { target } = match.groups
    if (EXTERNAL.test(target)) {
      continue
    }
    const [targetPath, anchor] = decodeURIComponent(target).split('#')
    const targetFile = targetPath ? path.join(path.dirname(file), targetPath) : file
    if (!fs.existsSync(targetFile)) {
      problems.push(`${file}: ${target} (file not found)`)
    } else if (anchor && targetFile.endsWith('.md') && !getAnchors(targetFile).has(anchor)) {
      problems.push(`${file}: ${target} (heading not found)`)
    }
  }
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join('\n')}\n\n${problems.length} broken link(s) in ${files.length} Markdown files\n`)
  process.exitCode = 1
} else {
  process.stdout.write(`All links in ${files.length} Markdown files are valid\n`)
}
