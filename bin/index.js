/*
 * @Author: youzhao.zhou
 * @Date: 2020-12-20 09:11:19
 * @Last Modified by: youzhao.zhou
 * @Last Modified time: 2020-12-20 18:28:56
 * @Description 根据ApiList生成Api Typing
 * 1. 通过命令行获取到apiList路径和生成d.ts的路径
 * 2. 以apiList为入口，使用webpack编译apiList，得到编译后的结果
 * 3. 读取编译后的apiList，转换成types文件，并存到指定文件
 * 执行命令：
 * mipp-api -o src/typings/Api/IApi.d.ts src/lib/api/apiList.ts
 * 依赖包：
 * commander globby make-dir webpack
 */
/* eslint-disable no-new-func */
const { readFileSync, writeFileSync, existsSync } = require("fs");
const { join, basename, dirname, extname } = require("path");
const webpack = require("webpack");
const globby = require("globby");
const mkDir = require("make-dir");
const { Command } = require("commander");
const baseConfig = require("../src/webpack.config");

const UNESCAPED_GLOB_SYMBOLS_RE = /(\\?)([()*?[\]{|}]|^!|[!+@](?=\())/g;
const curPathUrl = process.cwd().replace(UNESCAPED_GLOB_SYMBOLS_RE, "\\$2");

const program = new Command();
program.version("1.0.0");
program.option("-o, --outdir <string>", "output types file");
program.arguments("<source>").action((inputFile) => {
  const absoluteUrl = replaceBackslashes(join(curPathUrl, inputFile));
  if (!existsSync(absoluteUrl)) {
    throw new Error(`Not Find ${inputFile}`);
  }
  doParse(absoluteUrl);
});
program.parse(process.argv);

function doParse(inputFile) {
  webpack(baseConfig(inputFile), (err, stats) => {
    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
      throw new Error(info.errors);
    }

    try {
      writeFileSync(
        getOutDir(program.outdir),
        getApiList(
          replaceBackslashes(
            join(curPathUrl, "node_modules/.tmp/apiTypes", "mipp~ApiList.js"),
          ),
        ),
      );
      console.error("执行成功！");
    } catch (e) {
      console.error("执行失败！");
      throw e;
    }
  });
}

function getApiListPathUrl(importPathUrl) {
  if (importPathUrl) {
    return importPathUrl;
  }
  const srcPath = replaceBackslashes(join(curPathUrl, "src/**/apiList.ts"));

  const result = globby.sync(srcPath);

  return result[0];
}

function getOutDir(outdir) {
  if (outdir) {
    const filePath = replaceBackslashes(join(curPathUrl, outdir));
    if (extname(filePath) !== "ts") {
      if (!existsSync(filePath)) {
        mkDir.sync(filePath);
      }
      return join(filePath, "index.d.ts");
    }
    const parantPath = dirname(filePath);
    if (!existsSync(parantPath)) {
      mkDir.sync(parantPath);
    }
    return filePath;
  }
  const outpath = replaceBackslashes(
    join(
      curPathUrl,
      "mippApiListTypes",
      `${getBaseName(getApiListPathUrl())}.d.ts`,
    ),
  );
  mkDir.sync(replaceBackslashes(join(curPathUrl, "mippApiListTypes")));
  return outpath;
}

function getBaseName(sourceUrl) {
  return basename(sourceUrl, ".ts");
}

function getApiList(sourceUrl) {
  const content = readFileSync(sourceUrl, {
    encoding: "utf-8",
  });
  const apiList = new Function(
    `process.env.ENV_DATA = {}; return ${content}`,
  )();

  let str = `/*
 * @Description 主包接口定义声明
 */

interface IApis {`;
  Object.keys(apiList.default).forEach((item) => {
    str += getInterfaceStr(apiList.default[item], item);
  });
  return `${str}
}`;
}

function getInterfaceStr(api, key) {
  return `
  /**
   *${!api.desc ? "" : ` ${api.desc}`}
   * apiName: ${api.apiName}
   *${isEmptyParams(api.params) ? "" : " @param opts"}
   */
  ${key}(
    opts: IMiAPI.IApiOpts<${getParamsInterface(api.params)}>,
  ): Promise<IMiAPI.IApiSuccess<${getResInterface(api.res)}>>;
`;
}

function getResInterface(opts) {
  if (!opts) {
    return "any";
  }
  return opts;
}

function isEmptyParams(param) {
  if (!param) {
    return true;
  }
  if (!param.post && !param.get) {
    return true;
  }
  if (param.post && !param.get && param.post.length === 0) {
    return true;
  }
  if (!param.post && param.get && param.get.length === 0) {
    return true;
  }
  return false;
}

function getParamsInterface(params) {
  if (isEmptyParams(params)) {
    return "null";
  }
  let str = "";
  if (params.post) {
    const len = params.post.length;
    params.post.forEach((item, i) => {
      str += `${item.param}${item.required || item.isNeed ? "" : "?"}: ${
        item.type && item.type.trim() ? item.type : "any"
      };${len - 1 === i ? "" : "\n"}`;
    });
  }
  if (params.get) {
    const len = params.get.length;
    params.get.forEach((item, i) => {
      str += `${item.param}${item.required || item.isNeed ? "" : "?"}: ${
        item.type && item.type.trim() ? item.type : "any"
      };${len - 1 === i ? "" : "\n"}`;
    });
  }
  return `{
    ${str}
  }`;
}

/**
 * @param {string} str
 * @returns {string}
 */

function replaceBackslashes(str) {
  return str.replace(/\\/g, "/");
}
