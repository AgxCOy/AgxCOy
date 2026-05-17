import * as core from '@actions/core'
import * as github from '@actions/github'
import { fetch } from 'cross-fetch'

const client = github.getOctokit(core.getInput('github-token'))

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
  const origin = `https://github.com/${github.context.issue.owner}/${github.context.issue.repo}/issues/${github.context.issue.number}`

  // console.log(issue.body)
  const body = issue.body!.split("\n\n")
  const links = {
    title: body[1],
    img: body[3],
    desc: body[5],
    link: body[7],
    folder: body[9]?.trim(),
  }

  try {
    await fetch(links.link)
  }
  catch {
    // issue commenting
    client.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number,
      body: `链接无法访问。请修改 Issue 正文。
      
> CI ERROR: Link is unable to reach. may need commit again.`,
    })
    core.setFailed('Link is unable to reach. may need commit again.')
  }

  const commitMsg = `更新友链

${Object.entries(links)
  .map(([key, val]) => `- ${key}: ${val}`)
  .join('\r\n')}

详情(${origin})`

  console.log(links)
  console.log(commitMsg)

  core.setOutput('links', links)
  core.setOutput('message', commitMsg)
})
