const Vue = require("vue");
var decache = require("decache");
// koa
var koa = require("koa");
var server = new koa();

// koa-static
const staticServer = require('koa-static');
server.use(staticServer(__dirname + '/dist'));

// koa-router
var Router = require("koa-router");
var router = new Router();
server.use(router.routes()).use(router.allowedMethods());

// ssr renderer
const renderer = require("vue-server-renderer").createRenderer();

// Server-Side Bundle File
// var createApp = require("./dist/bundle.server.js")["default"];

// Client-Side Bundle File
const clientBundleFileUrl = './bundle.client.js';

router.get("*", function*(next) {
    // 清除require缓存
    decache("./dist/bundle.server.js");
    // Server-Side Bundle File
    var createApp = require("./dist/bundle.server.js")["default"];
    let ctx = this;
    const context = { url: ctx.url };

    yield createApp(context).then(app => {
            if (app.code === 404) {
                ctx.status = 404;
                ctx.type = 'text';
                ctx.body = "Page not found";
                return;
            } 
            renderer.renderToString(app, (err, html) => {
                if (err) {
                    ctx.status = 500;
                    ctx.type = 'html';
                    ctx.body = `
                        <h1>Error: ${err.message}</h1>
                        <pre>${err.stack}</pre>
                    `;
                    return;
                } else {
                    ctx.status = 200;
                    ctx.type = 'html';
                    ctx.body = `
                        <!DOCTYPE html>
                        <html lang="zh-CN">
                        <head>
                            <meta charset="utf-8"/>
                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
                        
                            <title>vue ssr step3</title>
                            <meta name="description" content=""/>
                            <meta name="format-detection" content="telephone=no">
                            <meta name="format-detection" content="email=no"/>
                            <link rel="stylesheet" type="text/css" href="./main.css" />
                        </head>
                        <body>
                            <div id="app">
                            ${html}
                            </div>
                            <script>window.__INITIAL_STATE__ = ${JSON.stringify(context.state)}</script>
                            <script src="${clientBundleFileUrl}"></script>
                        </body>
                        </html>
                    `;
                }
            });
        }).catch(err => {
            console.log("err:" + err);
        }
    );
});

var port = 3000;
server.listen(port, () => {
    console.log(`server started at localhost:${port}`);
});

process.on('unhandledRejection', (reason, p) => {
    console.log("Unhandled Rejection at: Promise ", p, " reason: ", reason);
    // application specific logging, throwing an error, or other logic here
});

const webpack = require('webpack');
const serverConfig = require('./build/webpack.server.js');
const clientConfig = require('./build/webpack.client.js');
/**
 * 初始化服务端编译
 *
 * @return {Promise}
 */
function initServerCompilePromise() {
    const serverCompiler = webpack(serverConfig);
    const clientCompiler = webpack(clientConfig);
    return new Promise((resolve, reject) => {
        serverCompiler.run((err, stats) => {
            stats = stats.toJson();
            stats.errors.forEach((error) => {
                console.error(error);
            });
            stats.warnings.forEach((error) => {
                console.warn(error);
            });
            if (err) {
                reject(err);
                return;
            }
            console.log('server compile done.');
            watchServerCompile(serverCompiler);
            resolve('done');
        });
        clientCompiler.run((err, stats) => {
            stats = stats.toJson();
            stats.errors.forEach((error) => {
                console.error(error);
            });
            stats.warnings.forEach((error) => {
                console.warn(error);
            });
            if (err) {
                reject(err);
                return;
            }
            console.log('clent compile done.');
            watchClientCompile(clientCompiler);
            resolve('done');
        });
    });
}

/**
 * 开启server端的watch监听
 *
 * @param {Object} serverCompiler - 对应的webpack编译器
 */
function watchServerCompile(serverCompiler) {
    serverCompiler.watch({}, (err, stats) => {
        stats = stats.toJson();
        stats.errors.forEach((error) => {
            console.error(error);
        });
        stats.warnings.forEach((error) => {
            console.warn(error);
        });
        if (err) {
            throw err;
        }
    });
}

/**
 * 开启client端的watch监听
 *
 * @param {Object} clientCompiler - 对应的webpack编译器
 */
function watchClientCompile(clientCompiler) {
    clientCompiler.watch({}, (err, stats) => {
        stats = stats.toJson();
        stats.errors.forEach((error) => {
            console.error(error);
        });
        stats.warnings.forEach((error) => {
            console.warn(error);
        });
        if (err) {
            throw err;
        }
    });
}

// webpack node api run/watch 文档：https://doc.webpack-china.org/api/node#compiler-compiler-instance-
initServerCompilePromise();