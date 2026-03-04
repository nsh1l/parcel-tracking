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
};
