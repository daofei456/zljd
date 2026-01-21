// 获取日历数据云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { userId, year, month } = event
  
  try {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-31`
    
    const { data: calendarData } = await db.collection('study_calendar')
      .where({
        userId,
        date: db.command.gte(startDate).and(db.command.lte(endDate))
      })
      .get()
    
    const result = {}
    calendarData.forEach(item => {
      result[item.date] = {
        totalTime: item.totalTime,
        completeCount: item.completeCount,
        escapeCount: item.escapeCount,
        subject: item.subjects && item.subjects.length > 0 ? item.subjects[item.subjects.length - 1] : null
      }
    })
    
    return { success: true, data: result }
  } catch (err) {
    console.error(err)
    return { success: false, error: err.message }
  }
}
