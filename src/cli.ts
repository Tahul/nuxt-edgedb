import { existsSync } from 'node:fs'
import * as p from '@clack/prompts'
import * as execa from 'execa'
import { createResolver } from '@nuxt/kit'
import chalk from 'chalk'

const { resolve: resolveProject } = createResolver(process.cwd())

async function up() {
  p.intro(chalk.bgGreen.blue(` nuxt-edgedb `))

  /**
   * CLI Install detection
   */
  let edgedbCliVersion: string | undefined
  try {
    edgedbCliVersion = await execa.execa(`edgedb`, [`--version`], { cwd: resolveProject() }).then(result => result.stdout.replace('EdgeDB CLI ', ''))
  }
  catch (e) {}

  if (!edgedbCliVersion) {
    const setupEdgeDbCli = await p.select({
      message: 'EdgeDB CLI not found, do you want to install EdgeDB it?',
      options: [
        { label: 'Yes', value: 'yes', hint: 'recommended' },
        { label: 'No', value: 'no', hint: 'skip installation' },
      ],
    })

    if (setupEdgeDbCli === 'yes') {
      const spinner = p.spinner()

      try {
        spinner.start('Installing EdgeDB CLI...')
        await execa.$`curl https://sh.edgedb.com --proto '=https' -sSf1 | sh`
        edgedbCliVersion = await execa.execa(`edgedb`, ['--version'], { cwd: resolveProject() }).then(result => result.stdout.replace('EdgeDB CLI ', ''))
        spinner.stop(`EdgeDB CLI version ${edgedbCliVersion} installed.`)
      }
      catch (e) {
        spinner.stop('Failed to install EdgeDB CLI.')
        p.log.warn(`Try running: \`${chalk.green('curl https://sh.edgedb.com --proto \'=https\' -sSf1 | sh')}\` manually.`)
      }
    }

    if (!edgedbCliVersion) {
      process.exit(0)
    }
  }
  else {
    p.log.success(`EdgeDB CLI version ${chalk.blue(edgedbCliVersion)} found.`)
  }

  const groupData = await p.group(
    {
      path: () => p.text({ message: 'Where to setup dbschema?', defaultValue: './dbschema', placeholder: './dbschema' }),
      interfaces: () => p.text({ message: 'Generate interfaces?', defaultValue: 'yes', placeholder: 'yes' }),
      queries: () => p.text({ message: 'Generate queries?', defaultValue: 'yes', placeholder: 'yes' }),
      queryBuilder: () => p.text({ message: 'Generate query builder?', defaultValue: 'yes', placeholder: 'yes' }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.')
        process.exit(0)
      },
    },
  )

  const dbschemaPath = resolveProject(groupData.path)

  if (!existsSync(dbschemaPath)) {
    p.log.error(`Your ${chalk.green('dbschema')} directory does not exist, you must run \`${chalk.green('edgedb project init')}\` at least once before running this command.`)
  }

  if (groupData.interfaces === 'yes') {
    const spinner = p.spinner()

    spinner.start('Generating interfaces...')
    await execa.$`npx @edgedb/generate interfaces --file ${dbschemaPath}/interfaces.ts --force-overwrite`
    spinner.stop('Interfaces generated.')
  }

  if (groupData.queries === 'yes') {
    const spinner = p.spinner()

    spinner.start('Generating queries...')
    await execa.$`npx @edgedb/generate queries --file ${dbschemaPath}/queries --target=ts --force-overwrite`
    spinner.stop('Queries generated.')
  }

  if (groupData.queryBuilder === 'yes') {
    const spinner = p.spinner()

    spinner.start('Generating query builder...')
    await execa.$`npx @edgedb/generate edgeql-js --output-dir ${dbschemaPath}/query-builder --force-overwrite --target=ts`
    spinner.stop('Query builder generated.')
  }

  p.log.success('Done. Feel free to checkout the next steps on the README')

  p.log.success('https://github.com/tahul/nuxt-edgedb#readme')
}

up()
