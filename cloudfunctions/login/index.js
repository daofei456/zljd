// 用户登录云函数
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { wxContext } = event
  
  try {
    // 获取用户的openId
    const openId = wxContext.OPENID
    
    // 查找用户
    const { data: users } = await db.collection('users').where({ openId }).get()
    
    let userId
    let isNewUser = false
    
    if (users.length === 0) {
      // 新用户，创建用户记录
      const userResult = await db.collection('users').add({
        data: {
          openId,
          nickName: '学习达人',
          avatarUrl: '',
          createTime: db.serverDate(),
          lastLoginTime: db.serverDate(),
          totalStudyTime: 0,
          currentGroupId: null,
          status: 'offline'
        }
      })
      
      userId = userResult._id
      isNewUser = true
    } else {
      // 老用户，更新最后登录时间
      const user = users[0]
      userId = user._id
      
      await db.collection('users').doc(userId).update({
        data: {
          lastLoginTime: db.serverDate()
        }
      })
    }
    
    return {
      success: true,
      userId,
      isNewUser
    }
  } catch (err) {
    console.error(err)
    return {
      success: false,
      error: err.message
    }
  }
}
