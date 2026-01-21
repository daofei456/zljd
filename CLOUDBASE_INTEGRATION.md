# CloudBase后端集成指南

## 📋 步骤1：创建CloudBase项目

### 1.1 注册腾讯云账号
1. 访问 https://cloud.tencent.com/ 注册腾讯云账号
2. 完成实名认证（需要身份证）

### 1.2 创建CloudBase环境
1. 登录腾讯云控制台
2. 进入"云开发 CloudBase"产品页面
3. 点击"新建环境"
4. 填写环境信息：
   - **环境名称**：例如 `zljd-study-app`
   - **环境ID**：系统自动生成（例如：`zljd-xxx`），记下这个ID
   - **计费模式**：选择"按量付费"或"免费版"（免费版有限制）
   - **地域**：选择离你最近的区域（例如：广州）

### 1.3 配置环境
1. 环境创建完成后，进入环境详情页
2. 开启以下服务：
   - ✅ 数据库
   - ✅ 云函数
   - ✅ 云存储
   - ✅ 静态网站托管（可选，用于部署）

### 1.4 获取配置信息
在环境详情页中，复制以下信息：
- **环境ID**：`your-env-id`
- **环境地域**：例如 `ap-guangzhou`

---

## 📊 步骤2：设计数据库表

### 2.1 用户表 (users)
```javascript
{
  "_id": "用户ID（自动生成）",
  "openId": "微信openId",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "createTime": "创建时间",
  "lastLoginTime": "最后登录时间",
  "totalStudyTime": 0,  // 总学习时长（分钟）
  "currentGroupId": null,  // 当前所在小组ID
  "status": "offline"  // online/studying/resting/offline
}
```

### 2.2 小组表 (groups)
```javascript
{
  "_id": "小组ID（自动生成）",
  "name": "小组名称",
  "description": "小组描述",
  "ownerId": "创建者ID",
  "joinCode": "邀请码（6位）",
  "maxMembers": 10,  // 人数上限
  "currentMembers": 0,  // 当前人数
  "todayTotalTime": 0,  // 今日总学习时长（分钟）
  "createTime": "创建时间"
}
```

### 2.3 小组成员表 (group_members)
```javascript
{
  "_id": "关系ID（自动生成）",
  "groupId": "小组ID",
  "userId": "用户ID",
  "userName": "用户名称",
  "role": "owner/member",  // 组长/成员
  "joinTime": "加入时间",
  "todayStudyTime": 0,  // 今日学习时长
  "totalStudyTime": 0,  // 总学习时长
  "currentStatus": "offline",  // online/studying/resting/offline
  "currentSubject": null,  // 当前学习科目
  "studyStartTime": null,  // 开始学习时间
  "contributionScore": 0  // 贡献积分
}
```

### 2.4 小组动态表 (group_activities)
```javascript
{
  "_id": "动态ID（自动生成）",
  "groupId": "小组ID",
  "userId": "用户ID",
  "userName": "用户名称",
  "activityType": "join/complete/escape/encourage",  // 动态类型
  "activityContent": "动态内容",
  "createTime": "创建时间"
}
```

### 2.5 学习记录表 (study_records)
```javascript
{
  "_id": "记录ID（自动生成）",
  "userId": "用户ID",
  "groupId": "小组ID",
  "subject": "学习科目",
  "duration": 25,  // 学习时长（分钟）
  "status": "complete/escape",  // 完成/逃跑
  "startTime": "开始时间",
  "endTime": "结束时间",
  "date": "日期（YYYY-MM-DD）"
}
```

### 2.6 日历数据表 (study_calendar)
```javascript
{
  "_id": "记录ID（自动生成）",
  "userId": "用户ID",
  "date": "日期（YYYY-MM-DD）",
  "totalTime": 0,  // 总学习时长
  "completeCount": 0,  // 完成次数
  "escapeCount": 0,  // 逃跑次数
  "subjects": []  // 学习科目列表
}
```

---

## ☁️ 步骤3：编写云函数

### 3.1 云函数目录结构
```
cloudfunctions/
├── createGroup/          # 创建小组
│   ├── index.js
│   └── package.json
├── joinGroup/            # 加入小组
│   ├── index.js
│   └── package.json
├── getGroupDetail/       # 获取小组详情
│   ├── index.js
│   └── package.json
├── updateMemberStatus/   # 更新成员状态
│   ├── index.js
│   └── package.json
└── uploadStudyRecord/    # 上传学习记录
    ├── index.js
    └── package.json
```

### 3.2 创建小组云函数 (createGroup)
```javascript
// cloudfunctions/createGroup/index.js
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

exports.main = async (event, context) => {
  const { name, description, maxMembers, userId } = event
  
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
    while (!isUnique) {
      joinCode = generateCode()
      const { data } = await db.collection('groups').where({ joinCode }).get()
      isUnique = data.length === 0
    }
    
    // 创建小组
    const groupResult = await db.collection('groups').add({
      data: {
        name,
        description,
        ownerId: userId,
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
        role: 'owner',
        joinTime: db.serverDate(),
        todayStudyTime: 0,
        totalStudyTime: 0,
        currentStatus: 'offline',
        contributionScore: 0
      }
    })
    
    // 添加小组动态
    await db.collection('group_activities').add({
      data: {
        groupId,
        userId,
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
```

### 3.3 加入小组云函数 (joinGroup)
```javascript
// cloudfunctions/joinGroup/index.js
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()
const _ = db.command

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
    
    return { success: true, groupId: group._id }
  } catch (err) {
    console.error(err)
    return { success: false, error: err.message }
  }
}
```

---

## 🔌 步骤4：连接前端和后端

### 4.1 初始化CloudBase
在`app.js`中添加CloudBase初始化代码：
```javascript
class StudyApp {
  constructor() {
    // ... 现有代码 ...
    
    // CloudBase配置
    this.cloudbase = null;
    this.db = null;
    
    // 初始化CloudBase
    this.initCloudBase();
  }
  
  initCloudBase() {
    const envId = 'your-env-id'; // 替换为你的环境ID
    
    this.cloudbase = new wx.cloud.Cloud({
      env: envId,
      traceUser: true
    });
    
    this.cloudbase.init();
    this.db = this.cloudbase.database();
    
    console.log('CloudBase初始化成功');
  }
}
```

### 4.2 调用云函数示例
```javascript
// 创建小组
async createGroup() {
  const name = document.getElementById('groupNameInput').value.trim();
  const description = document.getElementById('groupDescInput').value.trim();
  const maxMembers = parseInt(document.getElementById('groupMaxMembers').value);
  
  if (!name) {
    alert('请输入小组名称！');
    return;
  }
  
  try {
    const result = await this.cloudbase.callFunction({
      name: 'createGroup',
      data: { name, description, maxMembers, userId: this.getUserId() }
    });
    
    if (result.result.success) {
      alert(`小组"${name}"创建成功！\n\n邀请码：${result.result.joinCode}`);
      document.getElementById('createGroupModal').classList.add('hidden');
      await this.loadJoinedGroups();
    } else {
      alert('创建失败：' + result.result.error);
    }
  } catch (err) {
    console.error('创建小组失败：', err);
    alert('创建失败：' + err.message);
  }
}
```

---

## 🚀 部署步骤

### 1. 上传云函数
1. 右键点击`cloudfunctions`文件夹中的云函数目录
2. 选择"上传并部署：云端安装依赖"
3. 等待上传完成

### 2. 创建数据库表
1. 在CloudBase控制台进入"数据库"
2. 点击"新建集合"
3. 依次创建以下集合：
   - users
   - groups
   - group_members
   - group_activities
   - study_records
   - study_calendar

### 3. 配置权限
在数据库权限设置中，选择"自定义权限"并配置：
- **读取权限**：所有人可读
- **写入权限**：仅创建者可写（部分表需要管理员权限）

---

## 📝 注意事项

1. **免费版限制**：
   - 数据库：2GB
   - 云函数：20万次调用/月
   - 云存储：5GB
   - CDN流量：5GB/月

2. **用户认证**：
   - 建议使用微信小程序登录获取openId
   - Web端可使用匿名登录或自定义登录

3. **数据同步**：
   - 使用数据库监听功能实现实时更新
   - 定期刷新本地缓存

4. **安全性**：
   - 在云函数中验证用户权限
   - 不要在前端直接操作数据库，通过云函数调用

---

## ✅ 检查清单

- [ ] CloudBase环境创建完成
- [ ] 环境ID记录在案
- [ ] 数据库表创建完成
- [ ] 云函数上传部署成功
- [ ] 前端SDK引入正确
- [ ] 前端配置环境ID正确
- [ ] 云函数测试通过
- [ ] 前后端联调成功
