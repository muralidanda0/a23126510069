const axios = require('axios');

const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJkYW5kYW11cmFsaWtyaXNobmEuMjMuY3NlQGFuaXRzLmVkdS5pbiIsImV4cCI6MTc4MjE5OTE0NiwiaWF0IjoxNzgyMTk4MjQ2LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiMTFjZmNiNjEtNmViYS00YTc4LWEyNzAtOWVjMzYwMzhkMzlkIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoiZGFuZGEgbXVyYWxpIGtyaXNobmEiLCJzdWIiOiJlZGIxNTJhNS1jZDA4LTRlYjQtYmVmMi0xNjZmMDhhNTFkYjQifSwiZW1haWwiOiJkYW5kYW11cmFsaWtyaXNobmEuMjMuY3NlQGFuaXRzLmVkdS5pbiIsIm5hbWUiOiJkYW5kYSBtdXJhbGkga3Jpc2huYSIsInJvbGxObyI6ImEyMzEyNjUxMDA2OSIsImFjY2Vzc0NvZGUiOiJNVHF4YXIiLCJjbGllbnRJRCI6ImVkYjE1MmE1LWNkMDgtNGViNC1iZWYyLTE2NmYwOGE1MWRiNCIsImNsaWVudFNlY3JldCI6InFHRGFCc2dZWm1oWVRVQ3cifQ.dbIfab8dHMU6T2--CLKwDFbGxMN-lk4ehhVkvuObi7Y";


const Log = async (stack, level, pkg, message) => {
  try {
    await axios.post(
      'http://4.224.186.213/evaluation-service/logs',
      {
        stack,
        level,
        package: pkg,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (_) {

  }
};

module.exports = { Log };