import { readFile, writeFile } from 'fs/promises';
import { builtinRootDirectory } from './helpers/paths.js';

export const registerLicensesRoutes = (router) => {
  router.get('/licenses', async (context) => {
    context.type = 'text/plain';

    context.body = [
      '此程序的源代码可以在 https://github.com/drweissbrot/cs-hud 上查看.\n',
      '以下是源程序的声明:',
      await readFile(`${builtinRootDirectory}/license.txt`, 'utf-8'),
      '-----\n',
      await readFile(`${builtinRootDirectory}/assets/licenses.txt`, 'utf-8'),
    ].join('\n');
  });
};
