// 加入小组云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { joinCode, userId, userName } = event
  
  try {
    // 查找小组
    const { data: groups } = await db.collection('groups').where({ joinCode }).get()
    
    if (groups.length === 0) {
      return { success: false, error: '邀请码不存在' }
    }
    
    const group = groups[0]
    
    // 检查人数是否已满
    if (group.currentMembers >= group.maxMembers) {
      return { success: false, error: '小组人数已满' }
    }
    
    // 检查是否已加入
    const { data: members } = await db.collection('group_members').where({
      groupId: group._id,
      userId
    }).get()
    
    if (members.length > 0) {
      return { success: false, error: '你已经在这个小组了' }
    }
    
    // 加入小组
    await db.collection('group_members').add({
      data: {
        groupId: group._id,
        userId,
        userName,
        role: 'member',
        joinTime: db.serverDate(),
        todayStudyTime: 0,
        totalStudyTime: 0,
        currentStatus: 'offline',
        currentSubject: null,
        studyStartTime: null,
        contributionScore: 0
      }
    })
    
    // 更新小组成员数
    await db.collection('groups').doc(group._id).update({
      data: {
        currentMembers: group.currentMembers + 1
      }
    })
    
    // 添加小组动态
    await db.collection('group_activities').add({
      data: {
        groupId: group._id,
        userId,
        userName,
        activityType: 'join',
        activityContent: '加入了小组',
        createTime: db.serverDate()
      }
    })
    
    return { success: true, groupId: group._id, groupName: group.name }
  } catch (err) {
    console.error(err)
    return { success: false, error: err.message }
  }
}
