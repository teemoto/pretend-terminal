import { access, mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'pretend-terminal-consumer-'));
const artifactsDirectory = join(temporaryRoot, 'artifacts');
const consumerDirectory = join(temporaryRoot, 'consumer');

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, {
    cwd,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${arguments_.join(' ')} failed.`);
  }
}

async function pack(packageName) {
  run(
    'corepack',
    ['pnpm', '--filter', packageName, 'pack', '--pack-destination', artifactsDirectory],
    repositoryRoot,
  );
}

async function findTarball(packageFragment) {
  const files = await readdir(artifactsDirectory);
  const filename = files.find((file) => file.startsWith(packageFragment) && file.endsWith('.tgz'));

  if (!filename) {
    throw new Error(`Expected a packed ${packageFragment} artifact.`);
  }

  return join(artifactsDirectory, filename);
}

try {
  await mkdir(artifactsDirectory);
  await mkdir(join(consumerDirectory, 'src'), { recursive: true });
  run('corepack', ['pnpm', '--filter', '@pretend-terminal/core', 'build'], repositoryRoot);
  run('corepack', ['pnpm', '--filter', '@pretend-terminal/react', 'build'], repositoryRoot);
  await pack('@pretend-terminal/core');
  await pack('@pretend-terminal/react');

  const coreTarball = await findTarball('pretend-terminal-core-');
  const reactTarball = await findTarball('pretend-terminal-react-');

  await writeFile(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'pretend-terminal-packed-consumer-check',
        private: true,
        type: 'module',
        scripts: { typecheck: 'tsc --noEmit' },
        dependencies: {
          '@pretend-terminal/core': `file:${coreTarball}`,
          '@pretend-terminal/react': `file:${reactTarball}`,
          react: '19.2.1',
        },
        devDependencies: {
          '@types/react': '19.2.7',
          typescript: '5.9.3',
        },
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          lib: ['ES2022', 'DOM'],
          strict: true,
          noEmit: true,
        },
        include: ['src'],
      },
      null,
      2,
    )}\n`,
  );
  await writeFile(
    join(consumerDirectory, 'src', 'vanilla.ts'),
    `import { createTerminal } from '@pretend-terminal/core';
import '@pretend-terminal/core/styles.css';

const mount = document.createElement('div');

createTerminal(mount, {
  prompt: 'teemo@site:~ $',
  height: '26rem',
  theme: 'nord',
  commands: [
    {
      name: 'about',
      description: 'Learn about this site',
      response: { type: 'text', value: 'Built with Pretend Terminal.' },
    },
  ],
});
`,
  );
  await writeFile(
    join(consumerDirectory, 'src', 'react.tsx'),
    `import { PretendTerminal } from '@pretend-terminal/react';
import '@pretend-terminal/react/styles.css';

export function AboutTerminal() {
  return (
    <PretendTerminal
      ariaLabel="About this site"
      prompt="teemo@site:~ $"
      height="26rem"
      theme="nord"
      commands={[
        {
          name: 'about',
          description: 'Learn about this site',
          response: { type: 'text', value: 'Built with Pretend Terminal.' },
        },
      ]}
    />
  );
}
`,
  );

  run('corepack', ['pnpm', 'install', '--ignore-workspace', '--ignore-scripts'], consumerDirectory);
  await access(join(consumerDirectory, 'node_modules/@pretend-terminal/core/dist/styles.css'));
  await access(join(consumerDirectory, 'node_modules/@pretend-terminal/react/dist/styles.css'));
  run('corepack', ['pnpm', 'run', 'typecheck'], consumerDirectory);
} finally {
  await rm(temporaryRoot, { force: true, recursive: true });
}
