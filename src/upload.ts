import COS from 'cos-nodejs-sdk-v5';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import dotenv from 'dotenv';

dotenv.config();

export function UploadFile(filename: string, content: Buffer) {
  return new Promise((resolve, reject) => {
    const cos = new COS({
      SecretId: process.env.QC_SECRET_ID,
      SecretKey: process.env.QC_SECRET_KEY,
    });
    cos.putObject(
      {
        Bucket: process.env.QC_BUCKET!,
        Region: process.env.QC_REGION!,
        Key: filename,
        Body: content,
      },
      function (err, data) {
        if (err) {
          reject(err);
        }
        resolve(data);
      }
    );
  });
}

export function RefreshCdn(url: string) {
  return new Promise((resolve, reject) => {
    const CdnClient = tencentcloud.cdn.v20180606.Client;
    const client = new CdnClient({
      credential: {
        secretId: process.env.QC_SECRET_ID,
        secretKey: process.env.QC_SECRET_KEY,
      },
      region: 'ap-shanghai',
    });
    client.PurgeUrlsCache(
      {
        Urls: [url],
      },
      function (err, response) {
        if (err) {
          reject(err);
        }
        resolve(response);
      }
    );
  });
}
