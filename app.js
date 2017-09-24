const Vue = require("vue");
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
const createApp = require("./dist/bundle.server.js")["default"];

// Client-Side Bundle File
const clientBundleFileUrl = './bundle.client.js';

router.get("/api/getList", function *(next) {
    let ctx = this;
    ctx.status = 200;
    ctx.type = 'application/json';
    ctx.body = {
        code: 200,
        msg: [
            {'title': "华尔街英语"},
            {'title': "牛班音乐学校"},
            {'title': "果子油画"},
            {'title': "猫头鹰钢琴"}
        ]
    };
})

router.get("*", function*(next) {
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