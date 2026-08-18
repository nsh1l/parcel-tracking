export const CARRIERS = {
  sagawa: {
    label: "佐川急便",
    icon: "🚚",
    formatHint: "数字10桁または12桁",
    detect: /^(?:\d{10}|\d{12})$/,
    buildUrl: (n) =>
      `http://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${encodeURIComponent(n)}`,
  },
  yamato: {
    label: "ヤマト運輸",
    icon: "🐈",
    formatHint: "数字11桁または12桁",
    detect: /^(?:\d{11}|\d{12})$/,
    buildUrl: (n) =>
      `https://member.kms.kuronekoyamato.co.jp/parcel/detail?pno=${encodeURIComponent(n)}`,
  },
  seino: {
    label: "西濃運輸",
    icon: "🦘",
    formatHint: "数字10桁または12桁",
    detect: /^(?:\d{10}|\d{12})$/,
    buildUrl: (n) =>
      `https://track.seino.co.jp/cgi-bin/gnpquery.pgm?GNPNO1=${encodeURIComponent(n)}`,
  },
  fukutsu: {
    label: "福山通運",
    icon: "🌅",
    formatHint: "数字10桁または11桁",
    detect: /^(?:\d{10}|\d{11})$/,
    buildUrl: (n) =>
      `https://corp.fukutsu.co.jp/corp/recieve/tracking_no_hunt/${encodeURIComponent(n)}`,
  },
  okaken: {
    label: "オカケン",
    icon: "🦺",
    formatHint: "数字10桁",
    detect: /^\d{10}$/,
    buildUrl: (n) =>
      `https://www.okaken.co.jp/refer/respond.php?url=http://www1.okaken.co.jp/CCB/RMHR0002.PGM?FUNC=S&PWD=&GEN=${encodeURIComponent(n)}&SNY=&`,
  },
  dhl: {
    label: "DHL",
    icon: "🛩️",
    formatHint: "数字10桁",
    detect: /^\d{10}$/,
    buildUrl: (n) =>
      `https://mydhl.express.dhl/jp/ja/tracking.html#/results?id=${encodeURIComponent(n)}`,
  },
  fedex: {
    label: "FedEx",
    icon: "✈️",
    formatHint: "数字10・12・15・20・22桁、またはDT+数字12桁",
    detect: /^(?:\d{10}|\d{12}|\d{15}|\d{20}|\d{22}|DT\d{12})$/i,
    buildUrl: (n) =>
      `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  },
  ocs: {
    label: "OCS",
    icon: "🌐",
    formatHint: "数字11〜12桁",
    detect: /^\d{11,12}$/,
    buildUrl: (n) =>
      `https://webcsw.ocs.co.jp/csw/ECSWG0201R00003P.do?cwbno=${encodeURIComponent(n)}`,
  },
  ydh: {
    label: "YDH",
    icon: "🐼",
    formatHint: "英数字10〜40文字（固定桁なし）",
    buildUrl: (n) =>
      `https://www.ordertracker.com/track/${encodeURIComponent(n)}`,
  },
  japanpost: {
    label: "日本郵便",
    icon: "🏣",
    formatHint: "数字11桁、または英字2桁+数字9桁+JP",
    detect: /^(?:[A-Za-z]{2}\d{9}JP|\d{11})$/,
    buildUrl: (n) =>
      `https://trackings.post.japanpost.jp/services/srv/search?requestNo1=${encodeURIComponent(n)}&requestNo2=&requestNo3=&requestNo4=&requestNo5=&requestNo6=&requestNo7=&requestNo8=&requestNo9=&requestNo10=&search.x=100&search.y=25&startingUrlPatten=&locale=ja`,
  },
  sfexpress: {
    label: "SF Express",
    icon: "🇨🇳",
    formatHint: "数字12桁、またはSF+数字13桁",
    detect: /^(?:SF\d{13}|\d{12})$/i,
    buildUrl: (n) =>
      `https://www.sf-express.com/chn/en/waybill/waybill-detail/${encodeURIComponent(n)}`,
  },
};
