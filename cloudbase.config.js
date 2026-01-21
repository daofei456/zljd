// CloudBase配置文件
// 将此文件中的配置信息替换为你的实际配置

module.exports = {
  // CloudBase环境ID
  // 在腾讯云CloudBase控制台中获取
  envId: 'your-env-id',

  // 数据库集合名称
  collections: {
    users: 'users',
    groups: 'groups',
    group_members: 'group_members',
    group_activities: 'group_activities',
    study_records: 'study_records',
    study_calendar: 'study_calendar'
  },

  // 云函数名称
  cloudFunctions: {
    login: 'login',
    createGroup: 'createGroup',
    joinGroup: 'joinGroup',
    getMyGroups: 'getMyGroups',
    getGroupDetail: 'getGroupDetail',
    updateMemberStatus: 'updateMemberStatus',
    uploadStudyRecord: 'uploadStudyRecord',
    getCalendarData: 'getCalendarData'
  }
}
