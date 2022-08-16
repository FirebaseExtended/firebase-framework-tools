const frameworksIndex = import('./frameworks/index.js');
exports.injectConfig = (...args) => frameworksIndex.then(({ injectConfig }) => injectConfig(...args));
exports.build = (...args) =>frameworksIndex.then(({ build }) => build(...args));
