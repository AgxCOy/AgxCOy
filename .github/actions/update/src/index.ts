import * as core from '@actions/core'
import * as github from '@actions/github'
import { fetch } from 'cross-fetch'
import * as _gitea from 'gitea-js'
import * as cp from 'node:child_process'
import * as fs from 'node:fs'
import path from 'node:path'

const target = core.getInput('target')
const links = JSON.parse(core.getInput('links'))

const gitea = {
  ..._gitea,
  context: {
    server: core.getInput('gitea-server'),
    token: core.getInput('gitea-token'),
    owner: core.getInput('gitea-owner'),
    repo: core.getInput('gitea-repo'),
  },
  client: undefined as unknown as _gitea.Api<unknown>,
}
gitea.client = gitea.giteaApi(gitea.context.server, {
  token: gitea.context.token,
  customFetch: fetch,
})

const client = github.getOctokit(core.getInput('github-token'))

const hero = async (action: () => Promise<void>) => {
  try {
    await action()
  } catch (error: any) {
    if ('message' in error) core.setFailed(error.message)
    else core.setFailed(error)
  }
}

await hero(async () => {
  const branch = `links/gh#${github.context.issue.number}`
  const origin = `https://github.com/${github.context.issue.owner}/${github.context.issue.repo}/issues/${github.context.issue.number}`
  const tokenURL = `${gitea.context.server.replace('//', `//${gitea.context.token}@`)}/${gitea.context.owner}/${gitea.context.repo}.git`
  const options = {
    cwd: path.dirname(target),
  }
  cp.execSync(`git checkout -b '${branch}'`, options)
  cp.execSync(
    `git config --local user.email "github-actions[bot]@users.noreply.github.com"`,
    options,
  )
  cp.execSync(`git config --local user.name "github-actions[bot]"`, options)

  const text = await fs.promises.readFile(target, 'utf-8')
  const allLinks = JSON.parse(text)
  const newLinks = Object.assign(allLinks, links)
  await fs.promises.writeFile(target, JSON.stringify(newLinks, null, 2))

  const msg = Object.values(links as Record<string, any>)
    .map(([_, v]) => `- ${v.name.replace('"', '\\"')}`)
    .join('\r\n')

  cp.execSync(
    `git commit -m "更新友链

${msg}

详情(${origin})"`,
    options,
  )

  cp.execSync(`git push '${tokenURL}' '${branch}' --force`, options)

  const res = await client.rest.issues.get({
    issue_number: github.context.issue.number,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  })
  if (res.status !== 200) core.setFailed(`Failed to get issue: ${res.status}`)
  const issue = res.data

  gitea.client.repos.repoCreatePullRequest(
    gitea.context.owner,
    gitea.context.repo,
    {
      title: issue.title,
      body: `${issue.body ?? undefined}
      
## Reference
[原文地址](${origin})
      `,
      head: branch,
      base: 'main',
    },
  )
})
