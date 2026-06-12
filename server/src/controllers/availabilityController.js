import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function resolveDoctorId(req) {
  if (req.user.role === 'doctor') {
    return req.user._id;
  }

  return req.validated.body.doctorId || req.validated.query.doctorId;
}

export const getAvailability = asyncHandler(async (req, res) => {
  const doctorId = req.validated.query.doctorId || req.user._id;
  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor',
    isActive: true,
    approvedAt: { $ne: null }
  })
    .select('name specialty availability')
    .lean();

  if (!doctor) {
    throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }

  res.json({ doctor });
});

export const addAvailability = asyncHandler(async (req, res) => {
  const doctorId = resolveDoctorId(req);
  if (!doctorId) {
    throw new AppError('Doctor is required', 400, 'DOCTOR_REQUIRED');
  }

  const { dayOfWeek, startTime, endTime } = req.validated.body;
  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor',
    isActive: true,
    approvedAt: { $ne: null }
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }

  doctor.availability.push({ dayOfWeek, startTime, endTime });
  await doctor.save();

  res.status(201).json({ availability: doctor.availability });
});

export const deleteAvailability = asyncHandler(async (req, res) => {
  const doctorId = req.user.role === 'doctor' ? req.user._id : req.validated.query.doctorId;
  if (!doctorId) {
    throw new AppError('Doctor is required', 400, 'DOCTOR_REQUIRED');
  }

  const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
  if (!doctor) {
    throw new AppError('Doctor not found', 404, 'DOCTOR_NOT_FOUND');
  }

  const window = doctor.availability.id(req.params.id);
  if (!window) {
    throw new AppError('Availability window not found', 404, 'AVAILABILITY_NOT_FOUND');
  }

  window.deleteOne();
  await doctor.save();

  res.json({ availability: doctor.availability });
});
