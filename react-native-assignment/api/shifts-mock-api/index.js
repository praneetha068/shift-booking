import Joi from 'joi';
import Boom from 'boom';

import { delay } from './utils';
import { createMockDb } from './db';
import mockShifts from './mockShifts';

const db = createMockDb({ shifts: mockShifts });

const routes = [
  {
    method: 'GET',
    path: '/',
    handler: async () => {
      await delay(500);
      return db.shifts.list();
    },
  },

  {
    method: 'GET',
    path: '/{id}',
    handler: async ({ params }) => {
      const shift = await db.shifts.get(params.id);

      await delay(200);

      if (!shift) {
        throw Boom.notFound(`Shift not found with id ${params.id}`);
      }

      return shift;
    },

    config: {
      validate: {
        params: {
          id: Joi.string().required(),
        },
      },
    },
  },

  // BOOK SHIFT
  {
    method: 'POST',
    path: '/{id}/book',

    handler: async ({ params }) => {
      console.log('BOOK ROUTE HIT:', params.id);

      const shift = await db.shifts.get(params.id);

      console.log('SHIFT FOUND:', shift);

      if (!shift) {
        console.log('SHIFT NOT FOUND');

        throw Boom.notFound(
          `Shift not found with id ${params.id}`
        );
      }

      if (shift.booked) {
        console.log('SHIFT ALREADY BOOKED');

        throw Boom.badRequest(
          `Shift ${params.id} is already booked`
        );
      }

      if (Date.now() >= shift.endTime) {
        console.log('SHIFT ALREADY FINISHED');

        throw Boom.badRequest(
          'Shift is already finished'
        );
      }

      if (Date.now() > shift.startTime) {
        console.log('SHIFT ALREADY STARTED');

        throw Boom.badRequest(
          'Shift has already started'
        );
      }

      console.log('CHECKING OVERLAPPING SHIFTS');

      const allShifts = await db.shifts.list();

      const overlappingShiftExists = !!allShifts
        .filter((s) => s.booked)
        .find(
          (s) =>
            s.startTime < shift.endTime &&
            s.endTime > shift.startTime
        );

      if (overlappingShiftExists) {
        console.log('OVERLAPPING SHIFT FOUND');

        throw Boom.badRequest(
          'Cannot book an overlapping shift'
        );
      }

      console.log('SETTING BOOKED = TRUE');

      await db.shifts.set(
        params.id,
        { booked: true }
      );

      console.log('BOOKING SAVED');

      await delay(500);

      console.log('RETURNING BOOKED SHIFT');

      return db.shifts.get(params.id);
    },

    config: {
      payload: {
        parse: false,
      },

      validate: {
        params: {
          id: Joi.string().required(),
        },
      },
    },
  },

  // CANCEL SHIFT
  {
    method: 'POST',
    path: '/{id}/cancel',

    handler: async ({ params }) => {
      console.log('CANCEL ROUTE HIT:', params.id);

      const shift = await db.shifts.get(params.id);

      if (!shift) {
        throw Boom.notFound(
          `Shift not found with id ${params.id}`
        );
      }

      if (!shift.booked) {
        throw Boom.badRequest(
          'Cannot cancel shift that is not booked'
        );
      }

      await db.shifts.set(
        params.id,
        { booked: false }
      );

      await delay(500);

      return db.shifts.get(params.id);
    },

    config: {
      payload: {
        parse: false,
      },

      validate: {
        params: {
          id: Joi.string().required(),
        },
      },
    },
  },
];

const plugin = {
  name: 'shifts-mock-api',
  version: '1.0.0',

  register(server) {
    server.route(routes);
  },
};

export { plugin };