import http from 'http';

import mockShifts from './shifts-mock-api/mockShifts';

const shifts = mockShifts;

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });

  res.end(body);
}

function getShift(id) {
  return shifts.find((shift) => shift.id === id);
}

function hasOverlappingShift(shift) {
  return shifts
    .filter((s) => s.booked)
    .some(
      (s) =>
        s.startTime < shift.endTime &&
        s.endTime > shift.startTime
    );
}

const server = http.createServer((req, res) => {
  const url = new URL(
    req.url,
    'http://127.0.0.1:8080'
  );

  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });

    res.end();
    return;
  }

  // GET /shifts
  if (
    req.method === 'GET' &&
    pathname === '/shifts'
  ) {
    setTimeout(() => {
      sendJson(res, 200, shifts);
    }, 500);

    return;
  }

  // GET /shifts/:id
  const getMatch = pathname.match(
    /^\/shifts\/([^/]+)$/
  );

  if (
    req.method === 'GET' &&
    getMatch
  ) {
    const id = getMatch[1];
    const shift = getShift(id);

    setTimeout(() => {
      if (!shift) {
        sendJson(res, 404, {
          message: `Shift not found with id ${id}`,
        });

        return;
      }

      sendJson(res, 200, shift);
    }, 200);

    return;
  }

  // POST /shifts/:id/book
  const bookMatch = pathname.match(
    /^\/shifts\/([^/]+)\/book$/
  );

  if (
    req.method === 'POST' &&
    bookMatch
  ) {
    const id = bookMatch[1];

    const shift = getShift(id);

    if (!shift) {
      sendJson(res, 404, {
        message: `Shift not found with id ${id}`,
      });

      return;
    }

    if (shift.booked) {
      sendJson(res, 400, {
        message: `Shift ${id} is already booked`,
      });

      return;
    }

    if (Date.now() >= shift.endTime) {
      sendJson(res, 400, {
        message: 'Shift is already finished',
      });

      return;
    }

    if (Date.now() > shift.startTime) {
      sendJson(res, 400, {
        message: 'Shift has already started',
      });

      return;
    }

    if (hasOverlappingShift(shift)) {
      sendJson(res, 400, {
        message: 'Cannot book an overlapping shift',
      });

      return;
    }

    shift.booked = true;

    setTimeout(() => {
      sendJson(res, 200, shift);
    }, 500);

    return;
  }

  // POST /shifts/:id/cancel
  const cancelMatch = pathname.match(
    /^\/shifts\/([^/]+)\/cancel$/
  );

  if (
    req.method === 'POST' &&
    cancelMatch
  ) {
    const id = cancelMatch[1];

    const shift = getShift(id);

    if (!shift) {
      sendJson(res, 404, {
        message: `Shift not found with id ${id}`,
      });

      return;
    }

    if (!shift.booked) {
      sendJson(res, 400, {
        message: 'Cannot cancel shift that is not booked',
      });

      return;
    }

    // Cannot cancel after the shift has started
    if (Date.now() >= shift.startTime) {
      sendJson(res, 400, {
        message:
          'Cannot cancel a shift that has already started',
      });

      return;
    }

    shift.booked = false;

    setTimeout(() => {
      sendJson(res, 200, shift);
    }, 500);

    return;
  }

  sendJson(res, 404, {
    message: 'Route not found',
  });
});

server.listen(8080, '127.0.0.1', () => {
  console.info(
    '✅ API server is listening at http://127.0.0.1:8080'
  );
});