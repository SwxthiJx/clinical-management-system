export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Aarogya Care Hospital API',
    version: '1.0.0',
    description: 'Authentication, doctor scheduling, and appointment management API.'
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Availability' },
    { name: 'Appointments' },
    { name: 'Operations' }
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'clinic_access' },
      csrf: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              requestId: { type: 'string' }
            }
          }
        }
      },
      ConsultationNoteInput: {
        type: 'object',
        required: ['status'],
        properties: {
          subjective: { type: 'string', maxLength: 4000 },
          objective: { type: 'string', maxLength: 4000 },
          assessment: { type: 'string', maxLength: 4000 },
          plan: { type: 'string', maxLength: 4000 },
          prescriptions: { type: 'string', maxLength: 4000 },
          followUpInstructions: { type: 'string', maxLength: 2000 },
          followUpDate: { type: 'string', format: 'date', nullable: true },
          privateNotes: {
            type: 'string',
            maxLength: 4000,
            description: 'Visible only to the assigned doctor and administrators'
          },
          status: { type: 'string', enum: ['draft', 'finalized'] }
        }
      },
      PatientMedicalProfileInput: {
        type: 'object',
        required: ['age', 'bloodGroup', 'allergies', 'conditions', 'medications', 'emergencyContact'],
        properties: {
          age: { type: 'integer', minimum: 0, maximum: 130, nullable: true },
          bloodGroup: {
            type: 'string',
            enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
          },
          allergies: { type: 'array', maxItems: 30, items: { type: 'string', maxLength: 120 } },
          conditions: { type: 'array', maxItems: 30, items: { type: 'string', maxLength: 120 } },
          medications: { type: 'array', maxItems: 30, items: { type: 'string', maxLength: 120 } },
          emergencyContact: {
            type: 'object',
            required: ['name', 'relationship', 'phone'],
            properties: {
              name: { type: 'string', maxLength: 100 },
              relationship: { type: 'string', maxLength: 60 },
              phone: { type: 'string', maxLength: 30 }
            }
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { 200: { description: 'Healthy' } } }
    },
    '/ready': {
      get: {
        tags: ['Operations'],
        summary: 'Check API and database readiness',
        responses: {
          200: { description: 'Ready to serve traffic' },
          503: { description: 'A required dependency is unavailable' }
        }
      }
    },
    '/system/status': {
      get: {
        tags: ['Operations'],
        summary: 'Get administrator operational metrics',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'System and request metrics' },
          403: { description: 'Administrator permission required' }
        }
      }
    },
    '/system/audit-logs': {
      get: {
        tags: ['Operations'],
        summary: 'List recent audit events',
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: 'query', name: 'limit', schema: { type: 'integer', minimum: 1, maximum: 200, default: 50 } },
          { in: 'query', name: 'action', schema: { type: 'string' } },
          {
            in: 'query',
            name: 'actorRole',
            schema: { type: 'string', enum: ['patient', 'doctor', 'admin', 'system'] }
          }
        ],
        responses: {
          200: { description: 'Audit event list' },
          403: { description: 'Administrator permission required' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Create a cookie session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['login', 'password'],
                properties: { login: { type: 'string' }, password: { type: 'string' } }
              }
            }
          }
        },
        responses: { 200: { description: 'Authenticated' }, 401: { description: 'Invalid credentials' } }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a patient account',
        responses: { 201: { description: 'Patient created' } }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Current user' } }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate the refresh session',
        security: [{ csrf: [] }],
        responses: { 200: { description: 'Session refreshed' } }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke the current refresh session',
        security: [{ csrf: [] }],
        responses: { 204: { description: 'Signed out' } }
      }
    },
    '/auth/verify-email': {
      post: {
        tags: ['Auth'],
        summary: 'Verify a patient email address',
        responses: { 200: { description: 'Email verified' } }
      }
    },
    '/auth/resend-verification': {
      post: {
        tags: ['Auth'],
        summary: 'Request a new verification link',
        responses: { 200: { description: 'Request accepted' } }
      }
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset link',
        responses: { 200: { description: 'Request accepted' } }
      }
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset a password with a reset token',
        responses: { 200: { description: 'Password reset' } }
      }
    },
    '/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change the current password and revoke other sessions',
        security: [{ cookieAuth: [], csrf: [] }],
        responses: { 200: { description: 'Password changed' } }
      }
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'User list' } }
      }
    },
    '/users/doctors': {
      get: {
        tags: ['Users'],
        summary: 'List active approved doctors',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Doctor list' } }
      },
      post: {
        tags: ['Users'],
        summary: 'Create a doctor account',
        security: [{ cookieAuth: [], csrf: [] }],
        responses: { 201: { description: 'Doctor created' } }
      }
    },
    '/users/{id}/active': {
      patch: {
        tags: ['Users'],
        summary: 'Activate or deactivate a user',
        security: [{ cookieAuth: [], csrf: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'User status updated' } }
      }
    },
    '/users/me/medical-profile': {
      get: {
        tags: ['Users'],
        summary: 'Get the current patient medical profile',
        security: [{ cookieAuth: [] }],
        responses: {
          200: { description: 'Patient identity and medical profile' },
          403: { description: 'Patient permission required' }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Create or update the current patient medical profile',
        security: [{ cookieAuth: [], csrf: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatientMedicalProfileInput' }
            }
          }
        },
        responses: {
          200: { description: 'Medical profile saved' },
          403: { description: 'Only patients can update their own medical profile' }
        }
      }
    },
    '/users/{id}/medical-profile': {
      get: {
        tags: ['Users'],
        summary: 'Get an authorized patient medical profile',
        description:
          'Administrators may review any patient. Doctors may review only patients linked through a booked or completed appointment.',
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Patient identity and medical profile' },
          403: { description: 'Patient is outside the current user scope' }
        }
      }
    },
    '/availability': {
      get: {
        tags: ['Availability'],
        summary: 'Get doctor availability',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Availability' } }
      },
      post: {
        tags: ['Availability'],
        summary: 'Add an availability window',
        security: [{ cookieAuth: [], csrf: [] }],
        responses: { 201: { description: 'Window added' } }
      }
    },
    '/availability/{id}': {
      delete: {
        tags: ['Availability'],
        summary: 'Delete an availability window',
        security: [{ cookieAuth: [], csrf: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: { 204: { description: 'Window deleted' } }
      }
    },
    '/availability/exceptions': {
      get: {
        tags: ['Availability'],
        summary: 'List blocked dates',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Exception list' } }
      },
      post: {
        tags: ['Availability'],
        summary: 'Block a doctor date',
        security: [{ cookieAuth: [], csrf: [] }],
        responses: { 201: { description: 'Date blocked' } }
      }
    },
    '/availability/exceptions/{id}': {
      delete: {
        tags: ['Availability'],
        summary: 'Delete a blocked date',
        security: [{ cookieAuth: [], csrf: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: { 204: { description: 'Exception deleted' } }
      }
    },
    '/appointments': {
      get: {
        tags: ['Appointments'],
        summary: 'List appointments visible to the current user',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Appointment list' } }
      },
      post: {
        tags: ['Appointments'],
        summary: 'Book an appointment and send confirmation notifications',
        security: [{ cookieAuth: [], csrf: [] }],
        responses: { 201: { description: 'Appointment booked' }, 409: { description: 'Conflict' } }
      }
    },
    '/appointments/slots': {
      get: {
        tags: ['Appointments'],
        summary: 'Generate available slots for a doctor and date',
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: 'query', name: 'doctorId', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'date', required: true, schema: { type: 'string', format: 'date' } }
        ],
        responses: { 200: { description: 'Available slots' } }
      }
    },
    '/appointments/{id}/status': {
      patch: {
        tags: ['Appointments'],
        summary: 'Update an appointment status and notify participants',
        security: [{ cookieAuth: [], csrf: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Appointment updated' } }
      }
    },
    '/appointments/{id}/reschedule': {
      patch: {
        tags: ['Appointments'],
        summary: 'Move a booked appointment to another available slot',
        security: [{ cookieAuth: [], csrf: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['startTime'],
                properties: { startTime: { type: 'string', format: 'date-time' } }
              }
            }
          }
        },
        responses: {
          200: { description: 'Appointment rescheduled and participants notified' },
          409: { description: 'Slot conflict, blocked date, or terminal appointment status' }
        }
      }
    },
    '/appointments/{id}/consultation-note': {
      get: {
        tags: ['Appointments'],
        summary: 'Get the consultation note visible to the current user',
        description:
          'Patients receive finalized notes without private doctor fields. Assigned doctors and administrators can review drafts.',
        security: [{ cookieAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: {
          200: { description: 'Consultation note or null when no patient-visible note exists' },
          403: { description: 'Appointment is outside the current user scope' }
        }
      },
      put: {
        tags: ['Appointments'],
        summary: 'Create or update an appointment consultation note',
        description: 'Only the doctor assigned to the appointment can write consultation notes.',
        security: [{ cookieAuth: [], csrf: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ConsultationNoteInput' }
            }
          }
        },
        responses: {
          200: { description: 'Consultation note saved' },
          403: { description: 'Only the assigned doctor can update this note' },
          409: { description: 'Cancelled appointment or invalid draft transition' }
        }
      }
    },
    '/appointments/{id}/cancel': {
      patch: {
        tags: ['Appointments'],
        summary: 'Cancel an appointment and notify participants',
        security: [{ cookieAuth: [], csrf: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Appointment cancelled' } }
      }
    }
  }
};
