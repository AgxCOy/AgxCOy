import * as core from '@actions/core'
import * as github from '@actions/github'
import { fetch } from 'cross-fetch'
import * as _gitea from 'gitea-js'
import * as YAML from 'yaml'

const client = github.getOctokit(core.getInput('github-token'))
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

const hero = async (action: () => Promise<void>) => {
  try {
    await action()
  } catch (error: any) {
    if ('message' in error) core.setFailed(error.message)
    else core.setFailed(error)
  }
}

const getIssue = async () => {
  const res = await client.rest.issues.get({
    issue_number: github.context.issue.number,
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
  })

  if (res.status !== 200) core.setFailed(`Failed to get issue: ${res.status}`)

  if (
    !res.data.labels.find(i =>
      typeof i === 'string' ? i === 'blog-link' : i.name === 'blog-link',
    )
  )
    core.setFailed('Issue does not have the blog-link label')

  if (!res.data.body) core.setFailed('Issue does not have a body')

  return res.data
}

await hero(async () => {
  const issue = await getIssue()
  const branch = `links/gh#${github.context.issue.number}`
  const origin = `https://github.com/${github.context.issue.owner}/${github.context.issue.repo}/issues/${github.context.issue.number}`
  const tokenURL = `${gitea.context.server.replace('//', `//${gitea.context.token}@`)}/${gitea.context.owner}/${gitea.context.repo}.git`

  const links = Object.fromEntries(
    [
      ...issue
        .body!.replace(/<!--(.|\n)+?-->/g, '')
        .matchAll(/```yaml blog-link\n(?<data>(.|\n)+?)```/g),
    ]
      .map(i => i.groups?.['data'])
      .filter(i => !!i)
      .map(i => YAML.parse(i!))
      .map((i, index) => [`#${github.context.issue.number}:${index}`, i]),
  )

  const msg = `更新友链

${Object.values(links as Record<string, any>)
  .map(([_, v]) => `- ${v.name.replace('"', '\\"')}`)
  .join('\r\n')}

详情(${origin})`

  const data = {
    title: issue.title,
    body: `${issue.body ?? undefined}
    
## Reference
[原文地址](${origin})
    `,
    head: branch,
    base: 'main',
  }

  console.log(links)
  console.log(msg)

  core.setOutput('links', links)
  core.setOutput('branch', branch)
  core.setOutput('token-url', tokenURL)
  core.setOutput('message', msg)
  core.setOutput('pr-data', data)
})
