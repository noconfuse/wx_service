const RedisClient = require("./redis.js");
const fetchCNovData = require("./service/scrapCNov.js");
const Utils = require("./utils");
const tmpl = {
  0: "在90后开始告别20岁的时代潮流中，${0}找到自己惊世骇俗的逆生长方式，时光荏苒，光阴似箭，却未曾在他脸上留下痕迹。不问是非，不念过往，保持天真，甚至幼稚，越活越年轻，这才是当代青年的优秀楷模和榜样！"
};

const wrapperMessage = data => {
  let { ToUserName, FromUserName, Content } = data;
  return `<xml><ToUserName><![CDATA[${FromUserName}]]>
     </ToUserName><FromUserName><![CDATA[${ToUserName}]]>
     </FromUserName><CreateTime>${new Date().getTime()}</CreateTime><MsgType>
     <![CDATA[text]]></MsgType><Content><![CDATA[${Content}]]></Content></xml>`;
};

const wrapperArticlesMsg = data => {
  let { ToUserName, FromUserName, Content, Url } = data;
  return `<xml><ToUserName><![CDATA[${FromUserName}]]>
     </ToUserName><FromUserName><![CDATA[${ToUserName}]]>
     </FromUserName><CreateTime>${new Date().getTime()}</CreateTime><MsgType>
     <![CDATA[text]]></MsgType><Content><![CDATA[${Content}]]></Content></xml>`;
};

// 用户被动消息回复配置
const userMsgToContent = new Map();
userMsgToContent.set("测试", "回复您的名字：");

var xmlParser = require("xml2js").parseStringPromise;
var commonHandleFn = {
  handleText: async xmlData => {
    //这里记录用户回复消息
    let str = "success";
    let { ToUserName, Content } = xmlData;
    const redisKey = `${ToUserName}_msg`;
    let userMsg = await RedisClient.rpop(redisKey);
    if (Content.indexOf("测试") >= 0) {
      if (Content.toString().indexOf("测试") >= 0) {
        xmlData.Content = userMsgToContent.get("测试");
        str = wrapperMessage(xmlData);
        RedisClient.rpush(redisKey, "start");
        return str;
      }
    } else if (userMsg === "start") {
      //已经进入测试
      RedisClient.rpush(redisKey, Content);
      xmlData.Content = Utils.formatString(tmpl["0"], Content);
      str = wrapperMessage(xmlData);
      return str;
    } else if (Content) {
      //这里拿到缓存中地域信息
      try {
        var dataStr = await RedisClient.get("nCovData"),
          nCovData = [];
        if (!dataStr) {
          nCovData = await fetchCNovData();
        } else {
          nCovData = JSON.parse(dataStr);
        }
      } catch (error) {
        console.log(error);
      }

      let shootData = null;
      nCovData.some(data => {
        if (data.provinceName.indexOf(Content) >= 0) {
          shootData = data;
          return true;
        }
      });
      if (!shootData) {
        nCovData.some(data => {
          let isMatch = data.cities.some(cities => {
            return cities.cityName.indexOf(Content) >= 0;
          });
          if (isMatch) {
            shootData = data;
            return true;
          }
        });
      }
      xmlData.Content = formatCNovMsg(shootData);
      return wrapperMessage(xmlData);
    } else {
      return str;
    }
  }
};

function formatCNovMsg(shootData) {
  let str = "";
  if (!shootData) {
    return "感谢使用所遇非良人公众号服务，疫情查询如果对应的是城市没有数据，也会显示这段文字。数据源——>t.cn/A6v1xgC0";
  }
  const { cities } = shootData;
  //处理没有城市的情况
  if (JSON.stringify(cities) === "[]") {
    str += `${shootData.provinceName}  确认 ${shootData.confirmedCount}例 死亡 ${shootData.deadCount}例`;
  } else {
    cities.forEach(city => {
      str += `${city.cityName}  确认 ${city.confirmedCount}例 死亡 ${city.deadCount}例\n`;
    });
  }
  return str;
}

function formatMessage(result) {
  var message = {};
  if (typeof result === "object") {
    var keys = Object.keys(result);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var item = result[key];
      if (!(item instanceof Array) || item.length === 0) continue;
      if (item.length === 1) {
        var val = item[0];
        if (typeof val === "object") message[key] = formatMessage(val);
        else message[key] = (val || "").trim();
      } else {
        message[key] = [];
        for (var j = 0, k = item.length; j < k; j++)
          message[key].push(formatMessage(item[j]));
      }
    }
  }
  return message;
}

module.exports = function(req, res) {
  var data = "";
  req.on("data", function(chunk) {
    data += chunk;
  });
  req.on("end", function() {
    xmlParser(data)
      .then(result => {
        let messageObj = formatMessage(result.xml);
        switch (messageObj.MsgType) {
          case "text":
            commonHandleFn.handleText(messageObj).then(responseStr => {
              res.set("Content-type", "application/xml");
              res.send(responseStr);
            });
            break;
          default:
            res.send("success");
        }
      })
      .catch(err => {
        console.log(err, "解析xml失败");
        res.send("success");
      });
  });
};
