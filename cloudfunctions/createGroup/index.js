// 创建小组云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { name, description, maxMembers, userId, userName } = event
  
  // 生成6位邀请码
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
  
  try {
    // 检查邀请码是否重复
    let joinCode
    let isUnique = false
    let attempts = 0
    while (!isUnique && attempts < 100) {
      joinCode = generateCode()
      const { data } = await db.collection('groups').where({ joinCode }).get()
      isUnique = data.length === 0
      attempts++
    }
    
    if (!isUnique) {
      return { success: false, error: '生成邀请码失败，请重试' }
    }
    
    // 创建小组
    const groupResult = await db.collection('groups').add({
      data: {
        name,
        description,
        ownerId: userId,
        ownerName: userName,
        joinCode,
        maxMembers,
        currentMembers: 1,
        todayTotalTime: 0,
        createTime: db.serverDate()
      }
    })
    
    const groupId = groupResult._id
    
    // 创建者加入小组
    await db.collection('group_members').add({
      data: {
        groupId,
        userId,
        userName,
        role: 'owner',
        joinTime: db.serverDate(),
        todayStudyTime: 0,
        totalStudyTime: 0,
        currentStatus: 'offline',
        currentSubject: null,
        studyStartTime: null,
        contributionScore: 0
      }
    })
    
    // 添加小组动态
    await db.collection('group_activities').add({
      data: {
        groupId,
        userId,
        userName,
        activityType: 'join',
        activityContent: '创建了小组',
        createTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      groupId,
      joinCode
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err.message
    }
  }
}
