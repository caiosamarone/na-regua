import { FastifyInstance } from "fastify";
import { GetSlotsController } from "./controllers/get-slots.controller";
import { CreateAppointmentController } from "./controllers/create-appointment.controller";
import { ListCustomerAppointmentsController } from "./controllers/list-customer-appointments.controller";
import { GetCustomerAppointmentDetailController } from "./controllers/get-customer-appointment-detail.controller";
import { CancelAppointmentController } from "./controllers/cancel-appointment.controller";
import { StaffListAppointmentsController } from "./controllers/staff-list-appointments.controller";
import { StaffGetAppointmentDetailController } from "./controllers/staff-get-appointment-detail.controller";
import { MarkAppointmentDoneController } from "./controllers/mark-appointment-done.controller";
import { authenticate, requireRole } from "../../shared/hooks/auth.hook";

export async function bookingRoutes(app: FastifyInstance) {
  const getSlotsController = new GetSlotsController();
  const createAppointmentController = new CreateAppointmentController();
  const listCustomerAppointmentsController = new ListCustomerAppointmentsController();
  const getCustomerAppointmentDetailController = new GetCustomerAppointmentDetailController();
  const cancelAppointmentController = new CancelAppointmentController();
  const staffListAppointmentsController = new StaffListAppointmentsController();
  const staffGetAppointmentDetailController = new StaffGetAppointmentDetailController();
  const markAppointmentDoneController = new MarkAppointmentDoneController();

  // Public routes
  app.get("/barbershops/:id/slots", getSlotsController.handle.bind(getSlotsController));

  // Customer routes
  app.post("/appointments", {
    preHandler: [authenticate, requireRole("CUSTOMER")],
  }, createAppointmentController.handle.bind(createAppointmentController) as any);

  app.get("/customers/me/appointments", {
    preHandler: [authenticate, requireRole("CUSTOMER")],
  }, listCustomerAppointmentsController.handle.bind(listCustomerAppointmentsController) as any);

  app.get("/customers/me/appointments/:id", {
    preHandler: [authenticate, requireRole("CUSTOMER")],
  }, getCustomerAppointmentDetailController.handle.bind(getCustomerAppointmentDetailController) as any);

  // Cancel route — works for CUSTOMER, BARBER, and BARBERSHOP_ADMIN
  app.patch("/appointments/:id/cancel", {
    preHandler: [authenticate],
  }, cancelAppointmentController.handle.bind(cancelAppointmentController) as any);

  // Staff routes
  app.get("/barbershops/:id/appointments", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN", "BARBER")],
  }, staffListAppointmentsController.handle.bind(staffListAppointmentsController) as any);

  app.get("/barbershops/:id/appointments/:appointmentId", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN", "BARBER")],
  }, staffGetAppointmentDetailController.handle.bind(staffGetAppointmentDetailController) as any);

  app.patch("/appointments/:id/done", {
    preHandler: [authenticate, requireRole("BARBERSHOP_ADMIN", "BARBER")],
  }, markAppointmentDoneController.handle.bind(markAppointmentDoneController) as any);
}
