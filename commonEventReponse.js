

var xmlParser = require('xml2js').parseStringPromise;
var commonHandleFn = {
    handleText(xmlData) {
        let str = `<xml><ToUserName><![CDATA[${xmlData.FromUserName}]]>
        </ToUserName><FromUserName><![CDATA[${xmlData.ToUserName}]]>
        </FromUserName><CreateTime>${new Date().getTime()}</CreateTime><MsgType>
        <![CDATA[text]]></MsgType><Content><![CDATA[今天我生病了。。。]]></Content></xml>`;
        return str
    }
}

function formatMessage(result) {
    var message = {};
    if (typeof result === 'object') {
        var keys = Object.keys(result);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var item = result[key];
            if (!(item instanceof Array) || item.length === 0) continue;
            if (item.length === 1) {
                var val = item[0];
                if (typeof val === 'object') message[key] = formatMessage(val);
                else message[key] = (val || '').trim();
            } else {
                message[key] = [];
                for (var j = 0, k = item.length; j < k; j++) message[key].push(formatMessage(item[j]));
            }
        }
    }
    return message;
}



module.exports = function (req, res) {
    var data = '';
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        xmlParser(data).then(result => {
            let messageObj = formatMessage(result.xml);
            switch (messageObj.MsgType) {
                case 'text':
                    let responseStr = commonHandleFn.handleText(messageObj);
                    res.set('Content-type', 'application/xml')
                    res.send(responseStr)
                    break
                default:
                    res.send('success')
            }
        }).catch(err => {
            console.log(err, '解析xml失败')
            res.send('success')
        })
    })
}