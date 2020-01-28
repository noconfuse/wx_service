//写一个定时任务去跑这个脚本
const axios = require("axios");
const RedisClient = require("../redis.js");

var $reg = /<script id="getAreaStat">.+?window.getAreaStat\s=\s(\[\{.+?\])\}catch\(e\){}<\/script>/im;
module.exports = fetchcNovData = async () => {
  let res = await axios.get("https://3g.dxy.cn/newh5/view/pneumonia");
  const { data } = res;
  console.log(data);
  var result = data.match($reg);
  result = data.match($reg)[1];
  var resultJson = eval(result);
  resultJsonStr = JSON.stringify(resultJson);
  RedisClient.set("nCovData", resultJsonStr, 10);
  return resultJson;
};
