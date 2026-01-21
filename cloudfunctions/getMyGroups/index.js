// 获取我的小组列表云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { userId } = event
  
  try {
    // 查找用户加入的小组成员关系
    const { data: memberRelations } = await db.collection('group_members')
      .where({ userId })
      .get()
    
    if (memberRelations.length === 0) {
      return { success: true, groups: [] }
    }
    
    const groupIds = memberRelations.map(m => m.groupId)
    
    // 查找这些小组的信息
    const { data: groups } = await db.collection('groups')
      .where({
        _id: _.in(groupIds)
      })
      .get()
    
    return { success: true, groups: groups.map(g => ({
      id: g._id,
      name: g.name,
      description: g.description,
      member_count: g.currentMembers,
      max_members: g.maxMembers,
      today_total_time: g.todayTotalTime,
      join_code: g.joinCode,
      owner_id: g.ownerId,
      my_role: memberRelations.find(m => m.groupId === g._id).role
    }))}
  } catch (err) {
    console.error(err)
    return { success: false, error: err.message }
  }
}
