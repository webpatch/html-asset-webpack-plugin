'use strict';

function dictToHtmlAttribute(obj) {
  return Object.keys(obj).map(k => `${k}="${obj[k]}"`).join(' ');
}

function HtmlWebpackAssetPlugin() {
}

HtmlWebpackAssetPlugin.prototype.apply = function (compiler) {
  const self = this;
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-before-html-processing', function (htmlPluginData, callback) {
      htmlPluginData.html = self.insertAsset(htmlPluginData.html, htmlPluginData.plugin.options);
      callback(null, htmlPluginData);
    });
  });
};

HtmlWebpackAssetPlugin.prototype.insertAsset = function (html, options) {
  const { scripts = [], links = [], metas = [], title = '' } = options;

  const scriptTags = scripts.map(i => {
    if (typeof i === 'string') return `<script type="text/javascript" src="${i}"></script>`;
    return `<script type="text/javascript" ${dictToHtmlAttribute(i)}></script>`
  }).join('');

  const linkTags = links.map(i => {
    if (typeof i === 'string') return `<link rel="stylesheet" href="${i}"/>`;
    return `<link rel="stylesheet" ${dictToHtmlAttribute(i)}/>`
  }).join('');

  const metaTags = metas.map(i => {
    return `<meta ${dictToHtmlAttribute(i)} />`
  }).join('');

  let rs = html;
  rs = rs.replace(/\n*\s*{{scripts}}/, scriptTags);
  rs = rs.replace(/\n*\s*{{metas}}/, metaTags);
  rs = rs.replace(/\n*\s*{{links}}/, linkTags);
  rs = rs.replace('{{title}}', title);
  return rs;
};

module.exports = HtmlWebpackAssetPlugin;