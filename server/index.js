// ====== デバッグ用の index.js ======

console.log('--- [1] スクリプト開始 ---');

const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

console.log('--- [2] ライブラリの読み込み完了 ---');

require('dotenv').config();

console.log('--- [3] .envファイルの読み込み完了 ---');
console.log('SHEET_ID:', process.env.GOOGLE_SHEET_ID ? '読み込みOK' : '失敗 or 空');
console.log('SERVICE_EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '読み込みOK' : '失敗 or 空');
console.log('PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '読み込みOK' : '失敗 or 空');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*'
}));

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

console.log('--- [4] JWT認証オブジェクトの作成完了 ---');

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

console.log('--- [5] スプレッドシートオブジェクトの作成完了 ---');

let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

app.get('/api/sales-data', async (req, res) => {
  console.log('--- [/api/sales-data] リクエスト受信 ---');
  const now = Date.now();
  if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
    console.log('--- キャッシュからデータを返します ---');
    return res.json(cachedData);
  }

  try {
    console.log('--- スプレッドシートからのデータ取得を開始 ---');
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const data = rows.map(row => ({
      channel: row.get('商流'),
      sales: parseFloat(row.get('売上（税抜）')) || 0,
      profit: parseFloat(row.get('粗利（税抜）')) || 0,
      phase: row.get('案件フェーズ'),
      orderMonth: row.get('受注月'),
      deliveryMonth: row.get('納品月'),
      salesRep: row.get('営業担当'),
    }));

    cachedData = data;
    lastFetchTime = now;
    console.log('--- データ取得成功 ---');
    res.json(data);
  } catch (error) {
    console.error('!!!!!! データ取得中にエラーが発生しました !!!!!!');
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

console.log('--- [6] サーバー起動準備完了、listenを開始します ---');

app.listen(PORT, () => {
  console.log(`✅✅✅ [SUCCESS] Server is running on http://localhost:${PORT} ✅✅✅`);
});