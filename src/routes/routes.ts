import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

// ── Controllers ──────────────────────────────────────────────────────────────
import { authenticate, createUser, getUserById, updateUser, patchUser, deleteUser, resetPassword, authenticateRecovery, getCandidateUsers }
  from '../controllers/user.controller';

import { getAll as getAllCompanies, getById as getCompany, getByOwner as getCompanyByOwner, createCompany, updateCompany }
  from '../controllers/company.controller';

import { getAll as getJobOffers, getById as getJobOfferById, getByAttribute as getJobOfferByAttribute, create as createJobOffer, update as updateJobOffer, remove as deleteJobOffer, getJobOffersByCompany, triggerMatchForCompany }
  from '../controllers/jobOffer.controller';

import { getAll as getApplications, getById as getApplicationById, getByAttribute as getApplicationByAttribute, create as createApplication, update as updateApplication, patch as patchApplication, getApplicationsByCompany, getInternsByCompany, getRecruitedByCompany }
  from '../controllers/application.controller';

import { getMyNotifications as getNotifications, createNotification, markAsRead, markAllAsRead as markAllRead, getUnreadCount, deleteNotification }
  from '../controllers/notification.controller';

import { getSettings as getNotificationSettings, updateSettings as updateNotificationSettings }
  from '../controllers/notificationSetting.controller';

// import { sendEmail } from '../controllers/email.controller'; // TODO: implement or remove

import { getStats }
  from '../controllers/stats.controller';

import { getByCompany as getInterviewsByCompany, getInterviews, getById as getInterviewById, create as createInterview, updateInterview, patch as patchInterview, confirm }
  from '../controllers/interview.controller';

// import { generateAgoraToken } from '../controllers/agora.controller'; // TODO: implement or remove

import { getMyConversations as getConversations, getOrCreateConversation, getMessages, markConversationRead, deleteConversation }
  from '../controllers/conversation.controller';

import { getTasks, getTaskCount, getTaskById, getTaskByAttribute, createTask, updateTask, patchTask, getTaskResponses, getTaskResponseById, getTaskResponseByAttribute, getTaskResponseCountByAttribute, createTaskResponse, updateTaskResponse, patchTaskResponse }
  from '../controllers/task.controller';

import { getMyInterns, getMentorStats, getInternTaskResponses, getMentorTasks, createMentorTask, deleteMentorTask, getEvaluations, getMyEvaluations, createEvaluation, updateEvaluation, deleteEvaluation, assignMentor, getMentors, createMentor }
  from '../controllers/mentor.controller';

import { getAll as getProgramRequests, getMine as getMyProgramRequests, create as createProgramRequest, approve as approveProgramRequest, reject as rejectProgramRequest }
  from '../controllers/programRequest.controller';

const router = Router();

// ── Auth / Users ─────────────────────────────────────────────────────────────
router.post  ('/User/Authenticate',                       authenticate);
router.get   ('/User/ResetPassword/:email',               resetPassword);
router.get   ('/User/authenticaterecovery/:email/:code',  authenticateRecovery);
router.post  ('/User',                                    createUser);
router.get   ('/User/candidates',    authMiddleware,      getCandidateUsers);
router.get   ('/User/:id',           authMiddleware,      getUserById);
router.put   ('/User',               authMiddleware,      updateUser);
router.patch ('/User',               authMiddleware,      patchUser);
router.delete('/User/:id',           authMiddleware,      deleteUser);

// ── Company ──────────────────────────────────────────────────────────────────
router.get   ('/Company',            authMiddleware,      getAllCompanies);
router.get   ('/Company/owner',      authMiddleware,      getCompanyByOwner);
router.get   ('/Company/:id',        authMiddleware,      getCompany);
router.post  ('/Company',            authMiddleware,      createCompany);
router.put   ('/Company',            authMiddleware,      updateCompany);

// ── Job Offers ───────────────────────────────────────────────────────────────
router.get   ('/JobOffer/ByAttribute/:attributeName/:value', authMiddleware, getJobOfferByAttribute);
router.get   ('/JobOffer/company/:companyId',               authMiddleware, getJobOffersByCompany);
router.post  ('/JobOffer/triggerMatchForCompany/:companyId', authMiddleware, triggerMatchForCompany);
router.get   ('/JobOffer/:id',                              authMiddleware, getJobOfferById);
router.get   ('/JobOffer',                                  authMiddleware, getJobOffers);
router.post  ('/JobOffer',                                  authMiddleware, createJobOffer);
router.put   ('/JobOffer',                                  authMiddleware, updateJobOffer);
router.delete('/JobOffer/:id',                              authMiddleware, deleteJobOffer);

// ── Applications ─────────────────────────────────────────────────────────────
router.get   ('/JobOfferApplication/company/:companyId',          authMiddleware, getApplicationsByCompany);
router.get   ('/JobOfferApplication/interns/:companyId',          authMiddleware, getInternsByCompany);
router.get   ('/JobOfferApplication/recruited/:companyId',        authMiddleware, getRecruitedByCompany);
router.get   ('/JobOfferApplication/ByAttribute/:name/:value',    authMiddleware, getApplicationByAttribute);
router.get   ('/JobOfferApplication/:id',                         authMiddleware, getApplicationById);
router.get   ('/JobOfferApplication',                             authMiddleware, getApplications);
router.post  ('/JobOfferApplication',                             authMiddleware, createApplication);
router.put   ('/JobOfferApplication',                             authMiddleware, updateApplication);
router.patch ('/JobOfferApplication',                             authMiddleware, patchApplication);

// ── Notifications ────────────────────────────────────────────────────────────
router.get   ('/Notification',                            authMiddleware, getNotifications);
router.get   ('/Notification/unread-count',               authMiddleware, getUnreadCount);
router.post  ('/Notification',                            authMiddleware, async (req, res) => {
  const { userId, type, message, data } = req.body;
  await createNotification(userId, type || 'general', message || 'Nouvelle notification', data);
  res.status(201).json({ message: 'Notification créée' });
});
router.patch ('/Notification/:id/read',                   authMiddleware, markAsRead);
router.patch ('/Notification/read-all',                   authMiddleware, markAllRead);
router.delete('/Notification/:id',                        authMiddleware, deleteNotification);

// ── Notification Settings ────────────────────────────────────────────────────
router.get   ('/NotificationSetting',                     authMiddleware, getNotificationSettings);
router.put   ('/NotificationSetting',                     authMiddleware, updateNotificationSettings);

// ── Email ────────────────────────────────────────────────────────────────────
// router.post  ('/Email',                                   authMiddleware, sendEmail); // TODO: implement

// ── Stats ────────────────────────────────────────────────────────────────────
router.get   ('/stats',                                   authMiddleware, getStats);

// ── Interviews ───────────────────────────────────────────────────────────────
router.get   ('/Interview/company/:companyId',            authMiddleware, getInterviewsByCompany);
router.get   ('/Interview/:id',                           authMiddleware, getInterviewById);
router.get   ('/Interview',                               authMiddleware, getInterviews);
router.post  ('/Interview',                               authMiddleware, createInterview);
router.put   ('/Interview',                               authMiddleware, patchInterview);
router.patch ('/Interview',                               authMiddleware, patchInterview);
router.post  ('/Interview/:id/confirm',                   authMiddleware, confirm);

// ── Agora ────────────────────────────────────────────────────────────────────
// router.post  ('/agora/token',                             authMiddleware, generateAgoraToken); // TODO: implement

// ── Conversations / Messages ─────────────────────────────────────────────────
router.get   ('/Conversation',                            authMiddleware, getConversations);
router.post  ('/Conversation',                            authMiddleware, getOrCreateConversation);
router.get   ('/Conversation/:id/messages',               authMiddleware, getMessages);
// router.patch ('/Conversation/:id/read',                   authMiddleware, markConversationRead); // TODO: implement
// router.delete('/Conversation/:id',                        authMiddleware, deleteConversation); // TODO: implement

// ── Tasks ────────────────────────────────────────────────────────────────────
router.get   ('/Task/count',                                  authMiddleware, getTaskCount);
router.get   ('/Task/ByAttribute/:attributeName/:value',      authMiddleware, getTaskByAttribute);
router.get   ('/Task/:id',                                    authMiddleware, getTaskById);
router.get   ('/Task',                                        authMiddleware, getTasks);
router.post  ('/Task',                                        authMiddleware, createTask);
router.put   ('/Task',                                        authMiddleware, updateTask);
router.patch ('/Task',                                        authMiddleware, patchTask);

router.get   ('/TaskResponse/ByAttribute/:attributeName/:value',       authMiddleware, getTaskResponseByAttribute);
router.get   ('/TaskResponse/ByAttributeCount/:attributeName/:value',  authMiddleware, getTaskResponseCountByAttribute);
router.get   ('/TaskResponse/:id',                                     authMiddleware, getTaskResponseById);
router.get   ('/TaskResponse',                                         authMiddleware, getTaskResponses);
router.post  ('/TaskResponse',                                         authMiddleware, createTaskResponse);
router.put   ('/TaskResponse',                                         authMiddleware, updateTaskResponse);
router.patch ('/TaskResponse',                                         authMiddleware, patchTaskResponse);

// ── Mentor ───────────────────────────────────────────────────────────────────
router.get   ('/Mentor/interns',                          authMiddleware, getMyInterns);
router.get   ('/Mentor/stats',                            authMiddleware, getMentorStats);
router.get   ('/Mentor/tasks',                            authMiddleware, getMentorTasks);
router.post  ('/Mentor/tasks',                            authMiddleware, createMentorTask);
router.delete('/Mentor/tasks/:id',                       authMiddleware, deleteMentorTask);
router.get   ('/Mentor/interns/:internId/tasks',          authMiddleware, getInternTaskResponses);
router.get   ('/Mentor/evaluations/mine',                 authMiddleware, getMyEvaluations);
router.get   ('/Mentor/evaluations/:internId',            authMiddleware, getEvaluations);
router.post  ('/Mentor/evaluation',                       authMiddleware, createEvaluation);
router.put   ('/Mentor/evaluation',                       authMiddleware, updateEvaluation);
router.delete('/Mentor/evaluation/:id',                  authMiddleware, deleteEvaluation);
router.get   ('/Mentor/all',                              authMiddleware, getMentors);
router.post  ('/Mentor/create',                           authMiddleware, createMentor);
router.post  ('/Mentor/assign',                           authMiddleware, assignMentor);

// ── Program Requests ─────────────────────────────────────────────────────────
router.get   ('/ProgramRequest/mine',                     authMiddleware, getMyProgramRequests);
router.get   ('/ProgramRequest',                          authMiddleware, getProgramRequests);
router.post  ('/ProgramRequest',                          authMiddleware, createProgramRequest);
router.patch ('/ProgramRequest/:id/approve',              authMiddleware, approveProgramRequest);
router.patch ('/ProgramRequest/:id/reject',               authMiddleware, rejectProgramRequest);

export default router;
