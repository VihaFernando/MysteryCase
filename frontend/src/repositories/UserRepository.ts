import { notificationsApi, usersApi } from "@/api/endpoints";

export const userRepository = {
  list: usersApi.list,
  roles: usersApi.roles,
  updateRole: usersApi.updateRole,
  update: usersApi.update,
  audit: usersApi.audit,
  log: usersApi.log,
};

export const notificationRepository = notificationsApi;
