// 获取小组详情云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { groupId } = event
  
  try {
    // 获取小组信息
    const { data: group } = await db.collection('groups').doc(groupId).get()
    
    if (!group) {
      return { success: false, error: '小组不存在' }
    }
    
    // 获取小组成员
    const { data: members } = await db.collection('group_members')
      .where({ groupId })
      .orderBy('joinTime', 'asc')
      .get()
    
    // 获取小组动态
    const { data: activities } = await db.collection('group_activities')
      .where({ groupId })
      .orderBy('createTime', 'desc')
      .limit(20)
      .get()
    
    // 获取今日排行
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    
    // 从study_records表获取今日学习记录
    const { data: todayRecords } = await db.collection('study_records')
      .where({
        groupId,
        date: todayStr,
        status: 'complete'
      })
      .get()
    
    // 计算每个用户的今日学习时长和完成次数
    const userStats = {}
    todayRecords.forEach(record => {
      if (!userStats[record.userId]) {
        userStats[record.userId] = { time: 0, count: 0, name: record.userName }
      }
      userStats[record.userId].time += record.duration
      userStats[record.userId].count += 1
    })
    
    // 生成排行榜
    const ranking = Object.entries(userStats)
      .map(([userId, stats]) => ({
        userId,
        user_name: stats.name,
        study_time: stats.time,
        complete_count: stats.count
      }))
      .sort((a, b) => b.study_time - a.study_time)
      .slice(0, 10)
      .map((item, index) => ({
        rank: index + 1,
        ...item
      }))
    
    return {
      success: true,
      group: {
        id: group._id,
        name: group.name,
        description: group.description,
        member_count: group.currentMembers,
        max_members: group.maxMembers,
        today_total_time: group.todayTotalTime
      },
      members: members.map(m => ({
        user_id: m.userId,
        user_name: m.userName,
        role: m.role,
        current_status: m.currentStatus,
        current_subject: m.currentSubject,
        study_start_time: m.studyStartTime,
        today_study_time: m.todayStudyTime,
        contribution_score: m.contributionScore
      })),
      activities: activities.map(a => ({
        user_name: a.userName,
        activity_type: a.activityType,
        activity_content: a.activityContent,
        created_at: a.createTime
      })),
      ranking
    }
  } catch (err) {
    console.error(err)
    return { success: false, error: err.message }
  }
}
