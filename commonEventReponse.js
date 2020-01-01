

var xmlParser = require('xml2js').parseStringPromise;
var commonHandleFn = {
    handleText(xmlData) {
        let str = `<xml><ToUserName><![CDATA[${xmlData.FromUserName}]]>
        </ToUserName><FromUserName><![CDATA[${xmlData.ToUserName}]]>
        </FromUserName><CreateTime>${new Date().getTime()}</CreateTime><MsgType>
        <![CDATA['+'text'+']]></MsgType><Content><![CDATA[今天我生病了。。。]]></Content></xml>`;
        return str
    }
}

module.exports = function (req, res, next) {
    var data = '';
    req.on('data', function (chunk) {
        data += chunk;
    });
    req.on('end', function () {
        xmlParser(data).then(result => {
            console.log(result)
            switch (result.xml.MsgType) {
                case event: 'text'
                    let responseStr = commonHandleFn.handleText(result.xml);
                    res.send(responseStr)
                    break
            }
        })
    })
}