import axios from 'axios';
import fs from 'fs';

function sleep(sec) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}

async function queryData(paramName, pageNo = 1, rowsPerPage = 10, prev = []) {
  console.log(paramName, pageNo, rowsPerPage);
  const res = await axios.post(
    'https://new.singlewindow.cn/access/ui/1654414908097/Param002',
    {
      Data: JSON.stringify({
        paramName,
        pageNo,
        rowsPerPage,
        filterField: null,
        filterValue: null,
      }),
      Head: {},
    }
  );
  if (res.data.status === 'success') {
    const data = [...prev, ...res.data.data.data];
    if (res.data.data.pageSumCount > pageNo) {
      await sleep(1);
      return await queryData(paramName, pageNo + 1, rowsPerPage, data);
    } else {
      return data;
    }
  } else {
    console.log(res.data);
    throw 'Request failed';
  }
}

async function saveData(paramName) {
  const filePath = './' + paramName + '.json';
  if (!fs.existsSync(filePath)) {
    const data = await queryData(paramName);
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, json);
  }
}

async function queueJobs(jobs) {
  const [current, ...rest] = jobs;
  if (current) {
    await saveData(current.pqcode);
  }
  if (rest?.length) {
    queueJobs(rest);
  }
}

async function listParams() {
  const res = await axios.post(
    'https://new.singlewindow.cn/access/ui/1654414908097/Param001',
    {
      Data: JSON.stringify({}),
      Head: {},
    }
  );
  if (res.data.status === 'success') {
    await queueJobs(res.data.data);
  } else {
    throw 'Request error';
  }
}

listParams();
