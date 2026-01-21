// 更新成员状态云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { groupId, userId, userName, status, subject = null } = event
  
  try {
    const updateData = {
      currentStatus: status
    }
    
    // 如果开始学习，记录开始时间和科目
    if (status === 'studying') {
      updateData.currentSubject = subject
      updateData.studyStartTime = db.serverDate()
    } else {
      // 结束学习或休息，清除学习状态
      updateData.currentSubject = null
      updateData.studyStartTime = null
    }
    
    // 更新成员状态
    await db.collection('group_members').where({
      groupId,
      userId
    }).update({
      data: updateData
    })
    
    // 添加动态（开始学习）
    if (status === 'studying') {
      await db.collection('group_activities').add({
        data: {
          groupId,
          userId,
          userName,
          activityType: 'study',
          activityContent: `开始学习 ${subject}`,
          createTime: db.serverDate()
        }
      })
    }
    
    return { success: true }
  } catch (err) {
    console.error(err)
    return { success: false, error: err.message }
  }
}
