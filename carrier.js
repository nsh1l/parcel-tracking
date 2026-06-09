export const CARRIERS = {
  sagawa: {
    label: "佐川急便",
    icon: "🚚",
    buildUrl: (n) =>
      `http://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=${encodeURIComponent(n)}`,
  },
  yamato: {
    label: "ヤマト運輸",
    icon: "🐈",
    buildUrl: (n) =>
      `https://member.kms.kuronekoyamato.co.jp/parcel/detail?pno=${encodeURIComponent(n)}`,
  },
  seino: {
    label: "西濃運輸",
    icon: "🦘",
    buildUrl: (n) =>
      `https://track.seino.co.jp/cgi-bin/gnpquery.pgm?GNPNO1=${encodeURIComponent(n)}`,
  },
  fukutsu: {
    label: "福山通運",
    icon: "🌅",
    buildUrl: (n) =>
      `https://corp.fukutsu.co.jp/corp/recieve/tracking_no_hunt/${encodeURIComponent(n)}`,
  },
  okaken: {
    label: "オカケン",
    icon: "🦺",
    buildUrl: (n) =>
      `https://www.okaken.co.jp/refer/respond.php?url=http://www1.okaken.co.jp/CCB/RMHR0002.PGM?FUNC=S&PWD=&GEN=${encodeURIComponent(n)}&SNY=&`,
  },
  dhl: {
    label: "DHL",
    icon: "🛩️",
    buildUrl: (n) =>
      `https://mydhl.express.dhl/jp/ja/tracking.html#/results?id=${encodeURIComponent(n)}`,
  },
  ocs: {
    label: "OCS",
    icon: "🌐",
    buildUrl: (n) =>
      `https://webcsw.ocs.co.jp/csw/ECSWG0201R00003P.do?cwbno=${encodeURIComponent(n)}`,
  },
  ydh: {
    label: "YDH",
    icon: "🐼",
    buildUrl: (n) =>
      `https://www.ordertracker.com/track/${encodeURIComponent(n)}`,
  },
  japanpost: {
    label: "日本郵便",
    icon: "🏣",
    buildUrl: (n) =>
      `https://trackings.post.japanpost.jp/services/srv/search?requestNo1=${encodeURIComponent(n)}`,
  },
};
