// 上传学习记录云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, userName, groupId, subject, duration, status } = event
  
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  try {
    // 保存学习记录
    await db.collection('study_records').add({
      data: {
        userId,
        userName,
        groupId,
        subject,
        duration,
        status,
        startTime: new Date(today.getTime() - duration * 60 * 1000),
        endTime: db.serverDate(),
        date: dateStr
      }
    })
    
    // 更新日历数据
    const { data: calendarData } = await db.collection('study_calendar').where({
      userId,
      date: dateStr
    }).get()
    
    if (calendarData.length > 0) {
      // 更新现有记录
      const data = calendarData[0]
      await db.collection('study_calendar').doc(data._id).update({
        data: {
          totalTime: data.totalTime + duration,
          completeCount: status === 'complete' ? data.completeCount + 1 : data.completeCount,
          escapeCount: status === 'escape' ? data.escapeCount + 1 : data.escapeCount,
          subjects: _.addToSet(subject)
        }
      })
    } else {
      // 创建新记录
      await db.collection('study_calendar').add({
        data: {
          userId,
          date: dateStr,
          totalTime: duration,
          completeCount: status === 'complete' ? 1 : 0,
          escapeCount: status === 'escape' ? 1 : 0,
          subjects: [subject]
        }
      })
    }
    
    // 如果加入了小组，更新小组成员的学习数据
    if (groupId) {
      // 更新成员数据
      const { data: memberData } = await db.collection('group_members').where({
        groupId,
        userId
      }).get()
      
      if (memberData.length > 0) {
        const member = memberData[0]
        await db.collection('group_members').doc(member._id).update({
          data: {
            todayStudyTime: member.todayStudyTime + duration,
            totalStudyTime: member.totalStudyTime + duration,
            contributionScore: status === 'complete' ? member.contributionScore + Math.floor(duration / 10) : member.contributionScore,
            currentStatus: 'offline',
            currentSubject: null,
            studyStartTime: null
          }
        })
      }
      
      // 更新小组总时长
      const { data: groupData } = await db.collection('groups').doc(groupId).get()
      await db.collection('groups').doc(groupId).update({
        data: {
          todayTotalTime: groupData.todayTotalTime + duration
        }
      })
      
      // 添加小组动态
      const activityContent = status === 'complete' 
        ? `完成了${duration}分钟${subject}学习`
        : `逃跑了，连${duration}分钟都坚持不了？`
      
      await db.collection('group_activities').add({
        data: {
          groupId,
          userId,
          userName,
          activityType: status,
          activityContent,
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
