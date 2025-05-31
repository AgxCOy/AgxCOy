import * as core from '@actions/core'
import * as github from '@actions/github'
import * as YAML from 'yaml'

const client = github.getOctokit(core.getInput('token'))

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

  console.log(links)

  core.setOutput('links', links)
})
