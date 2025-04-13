import { config } from '../../src/config';

module.exports = {
  config: {
    target: `http://localhost:${config.server.port}`,
    phases: [
      // Warm up phase
      {
        duration: 60,
        arrivalRate: 1,
        rampTo: 5,
        name: "Warm up"
      },
      // Ramp up load
      {
        duration: 120,
        arrivalRate: 5,
        rampTo: 20,
        name: "Ramp up load"
      },
      // Sustained load
      {
        duration: 300,
        arrivalRate: 20,
        name: "Sustained load"
      },
      // Peak load
      {
        duration: 120,
        arrivalRate: 20,
        rampTo: 50,
        name: "Peak load"
      },
      // Cool down
      {
        duration: 60,
        arrivalRate: 5,
        name: "Cool down"
      }
    ],
    defaults: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  },
  scenarios: [
    {
      name: 'Game Flow',
      flow: [
        // Start game
        {
          post: {
            url: '/webhook',
            json: {
              From: '+1{{ random "0123456789", 10 }}',
              Body: 'START'
            },
            capture: {
              json: '$.phoneNumber',
              as: 'phoneNumber'
            }
          }
        },
        // Get first clue
        {
          get: {
            url: '/webhook',
            qs: {
              From: '{{ phoneNumber }}'
            }
          }
        },
        // Submit answers (mix of correct and incorrect)
        {
          loop: [
            {
              post: {
                url: '/webhook',
                json: {
                  From: '{{ phoneNumber }}',
                  Body: '{{ $randomString }}'
                }
              }
            }
          ],
          count: 3
        },
        // Request hint
        {
          post: {
            url: '/webhook',
            json: {
              From: '{{ phoneNumber }}',
              Body: 'HINT'
            }
          }
        }
      ]
    },
    {
      name: 'Admin Operations',
      flow: [
        // List clues
        {
          get: {
            url: '/admin/clues',
            headers: {
              'x-api-key': '{{ $processEnvironment.ADMIN_API_KEY }}'
            }
          }
        },
        // Get active sessions
        {
          get: {
            url: '/admin/sessions?active=true',
            headers: {
              'x-api-key': '{{ $processEnvironment.ADMIN_API_KEY }}'
            }
          }
        },
        // Get game statistics
        {
          get: {
            url: '/admin/stats',
            headers: {
              'x-api-key': '{{ $processEnvironment.ADMIN_API_KEY }}'
            }
          }
        }
      ]
    },
    {
      name: 'Health Check',
      flow: [
        {
          get: {
            url: '/health'
          }
        }
      ]
    }
  ],
  environments: {
    development: {
      target: `http://localhost:${config.server.port}`,
      phases: [
        {
          duration: 30,
          arrivalRate: 1,
          rampTo: 2
        }
      ]
    },
    production: {
      target: process.env.API_URL || `http://localhost:${config.server.port}`,
      phases: [
        {
          duration: 60,
          arrivalRate: 5,
          rampTo: 50
        }
      ]
    }
  }
}; 