import * as core from '@actions/core'
import * as fs from 'node:fs'

const target = core.getInput('target')
const links = JSON.parse(core.getInput('links'))

const hero = async (action: () => Promise<void>) => {
  try {
    await action()
  } catch (error: any) {
    if ('message' in error) core.setFailed(error.message)
    else core.setFailed(error)
  }
}

await hero(async () => {
  // const text = await fs.promises.readFile(target, 'utf-8')
  // const allLinks = JSON.parse(text)
  // const newLinks = Object.assign(allLinks, links)
  // 懒得动博客的刀了，只取一个友链 block.
  const mainlink = Object.values(links)[0]
  await fs.promises.writeFile(target, JSON.stringify(mainlink, null, 2))
})
