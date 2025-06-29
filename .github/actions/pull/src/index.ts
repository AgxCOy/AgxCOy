import * as core from '@actions/core'
import { fetch } from 'cross-fetch'
import * as _gitea from 'gitea-js'

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

await hero(async () => {
  const prdata = JSON.parse(core.getInput('pr-data'))

  let conflicts = null
  try {
    const existpr = await gitea.client.repos.repoListPullRequests(
      gitea.context.owner,
      gitea.context.repo,
      {
        state: 'open',
      }
    )
    conflicts = existpr.data.filter(pr => pr.head?.ref === prdata.head).length > 0
  } catch (error: any) { }

  if (conflicts) {
    core.info(`Already exists a PR for this issue, skipping creation.`)
    return
  }

  await gitea.client.repos.repoCreatePullRequest(
    gitea.context.owner,
    gitea.context.repo,
    prdata,
  )
})
