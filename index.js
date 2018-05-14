const fs = require('fs');
const path = require('path');

function dictToHtmlAttribute(obj) {
  return Object.keys(obj).map(k => `${k}="${obj[k]}"`).join(' ');
}

function readTemplate(name) {
  return fs.readFileSync(`./template/${name}`, { encoding: 'utf8' });
}

function genScript(i) {
  if (typeof i === 'string') return `<script type="text/javascript" src="${i}"></script>`;
  return `<script type="text/javascript" ${dictToHtmlAttribute(i)}></script>`
}

function genStyle(i) {
  if (typeof i === 'string') return `<link rel="stylesheet" href="${i}"/>`;
  return `<link rel="stylesheet" ${dictToHtmlAttribute(i)}/>`
}

function HTMLPlugin(options) {
  this.options = options;
}

HTMLPlugin.prototype.apply = function (compiler) {

  const emit = (compilation, callback) => {
    const hash = compilation.hash.substr(0, 5);
    const entrys = new Map();

    compilation.entrypoints.forEach(function (v, k) {
      const script = [];
      const css = [];

      v.chunks.forEach(c => {
        c.files.forEach(f => {
          if (f.endsWith('.js')) {
            script.push(f);
          } else if (f.endsWith('.css')) {
            css.push(f);
          }
        })
      });

      entrys.set(k, { script, css })
    });

    const defaultTemplate = readTemplate('index.html');

    const { html, config } = this.options;

    if (config) {
      const cfg = fs.readFileSync(config, { encoding: 'utf8' });
      compilation.fileDependencies.add(path.resolve(config));
      compilation.assets[config] = {
        source: () => cfg,
        size: () => cfg.length,
      };
    }

    const htmlConfig = {};
    html.forEach(i => {
      htmlConfig[i.name] = i;
    });

    entrys.forEach((v, k) => {
      let { scripts = [], links = [], metas = [], title = '', template = '' } = htmlConfig[k];

      if (config) {
        scripts = [`${config}?v=${hash}`, ...scripts];
      }

      const scriptTags = [...scripts, ...v.script].map(i => genScript(i)).join('\n');
      const linkTags = [...links, ...v.css].map(i => genStyle(i)).join('\n');
      const metaTags = metas.map(i => `<meta ${dictToHtmlAttribute(i)} />`).join('\n');

      const templateSource = template ? readTemplate(template) : defaultTemplate;
      let rs = templateSource.replace(/\n*\s*{{scripts}}/, scriptTags);
      rs = rs.replace(/\n*\s*{{metas}}/, metaTags);
      rs = rs.replace(/\n*\s*{{links}}/, linkTags);
      rs = rs.replace('{{title}}', title);

      const filename = `${k}.html`;
      compilation.assets[filename] = {
        source: () => rs,
        size: () => rs.length,
      };
    });

    callback();
  };

  if (compiler.hooks) {
    const plugin = { name: 'MyPlugin' };
    compiler.hooks.emit.tapAsync(plugin, emit);
  }

};

module.exports = HTMLPlugin;