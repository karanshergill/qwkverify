// alias-loader.mjs
import { pathToFileURL } from 'url';
import path from 'path';

const projectRoot = process.cwd();

const aliases = {
  '@shared': 'shared',
  '@web': 'web',
  '@generated': 'generated',
};

export async function resolve(specifier, context, defaultResolve) {
  for (const alias in aliases) {
    if (specifier.startsWith(alias)) {
      const subPath = specifier.slice(alias.length);
      const aliasTarget = path.join(projectRoot, aliases[alias], subPath);
      const finalPath = path.extname(aliasTarget) ? aliasTarget : aliasTarget + '.js';

      return {
        url: pathToFileURL(finalPath).href,
        shortCircuit: true
      };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
