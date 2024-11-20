import dayjs from 'dayjs';

import CreateClient from './client';
import { logChain, moduleLog } from './logger';
import { RefreshCdn, UploadFile } from './upload';

interface IClassroom {
  [key: string]: string;
  /** 学校校区代码(显示) "宝山" */
  XXXQDM_DISPLAY: string;
  /** 教师名称 "A101" */
  JASMC: string;
  /** 学校校区代码 "1" */
  XXXQDM: string;
  /** 日期 "2024-11-20" */
  RQ: string;
  // 占用情况
  J1: '0' | '1';
  J2: '0' | '1';
  J3: '0' | '1';
  J4: '0' | '1';
  J5: '0' | '1';
  J6: '0' | '1';
  J7: '0' | '1';
  J8: '0' | '1';
  J9: '0' | '1';
  J10: '0' | '1';
  J11: '0' | '1';
  J12: '0' | '1';
  /** 教室容量 "90" */
  SKZWS: string;
  /** 教室代码 "B1002-A101" */
  JASDM: string;
  /** 教学楼代码 "01" */
  JXLDM: string;
  /** 教学楼代码(显示) "A" */
  JXLDM_DISPLAY: string;
}

interface ISimplifiedClassroom {
  building: string;
  campus: string;
  classroom: string;
  status: number;
  size: number;
}

const client = CreateClient('https://jw.shu.edu.cn/jwapp/sys/', 'jwapp');

client('/yjsrzfwapp/shuIndex.do?type=jsjyrqcxsy', {
  maxRedirects: 0,
  validateStatus: (status) => status === 302,
}).then((res) => {
  if (!res.headers.hasOwnProperty('set-cookie'))
    throw new Error('No cookies found');
  client('/jsjy/modules/jsjyrqcxsy/jsjyrqcxlbsy.do', {
    method: 'POST',
    data: `*order=%2BXXXQDM%2C%2BJXLDM%2C%2BJASDM&querySetting=%5B%7B%22name%22%3A%22RQ%22%2C%22caption%22%3A%22%E6%97%A5%E6%9C%9F%22%2C%22linkOpt%22%3A%22AND%22%2C%22builderList%22%3A%22cbl_String%22%2C%22builder%22%3A%22include%22%2C%22value%22%3A%22${dayjs().format(
      'YYYY-MM-DD'
    )}%22%7D%2C%7B%22name%22%3A%22*order%22%2C%22value%22%3A%22%2BXXXQDM%2C%2BJXLDM%2C%2BJASDM%22%2C%22linkOpt%22%3A%22AND%22%2C%22builder%22%3A%22m_value_equal%22%7D%5D&pageSize=500&pageNumber=1`,
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  }).then((res) => {
    if (
      res.data.code !== '0' ||
      typeof res.data.datas?.jsjyrqcxlbsy?.totalSize === undefined ||
      res.data.datas.jsjyrqcxlbsy.totalSize === 0
    )
      throw new Error('Fetch failed');
    const data: IClassroom[] = res.data.datas.jsjyrqcxlbsy.rows;
    moduleLog('jwapp', logChain('classroom length', data.length));
    const simplified_data: ISimplifiedClassroom[] = data.map((classroom) => {
      let status = 0;
      for (let i = 1; i <= 12; i++)
        status = (status << 1) | parseInt(classroom[`J${i}`]);
      return {
        building: classroom.JXLDM_DISPLAY,
        campus: classroom.XXXQDM_DISPLAY,
        classroom: classroom.JASMC,
        status,
        size: parseInt(classroom.SKZWS),
      };
    });
    moduleLog('jwapp', logChain('simplified length', simplified_data.length));
    const filename = `roomuse/${new Date().getDay()}.json`;
    UploadFile(
      filename,
      Buffer.from(
        JSON.stringify({
          code: 0,
          infos: simplified_data,
          message: 'success',
          update: new Date().getTime(),
        })
      )
    ).then(() => {
      moduleLog('jwapp', logChain('upload success', filename));
      RefreshCdn(`https://calendar-subscription.shuhole.cn/${filename}`).then(
        () => {
          moduleLog('jwapp', logChain('refresh success', filename));
        }
      );
    });
  });
});
