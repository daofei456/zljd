# CloudBase部署指南

## 📋 前置准备

### 1. 注册腾讯云账号
1. 访问 https://cloud.tencent.com/ 注册
2. 完成实名认证（需要身份证）

### 2. 安装CloudBase CLI
```bash
npm install -g @cloudbase/cli
```

### 3. 登录CloudBase
```bash
cloudbase login
```

## 🚀 部署步骤

### 步骤1：创建CloudBase环境

1. 登录腾讯云控制台
2. 进入"云开发 CloudBase"
3. 点击"新建环境"
4. 填写信息：
   - 环境名称：`zljd-study-app`
   - 计费模式：选择"按量付费"或"免费版"
   - 地域：选择离你最近的区域
5. 记录环境ID（格式如：`zljd-xxxxxxxx`）

### 步骤2：配置环境ID

1. 打开 `app.js` 文件
2. 找到第96行左右的 `initCloudBase` 方法
3. 将 `your-env-id` 替换为你的实际环境ID：

```javascript
const envId = 'your-env-id'; // 替换为你的环境ID
```

例如：
```javascript
const envId = 'zljd-xxxxxxxx';
```

### 步骤3：创建数据库集合

在CloudBase控制台的"数据库"页面中，依次创建以下集合：

| 集合名称 | 说明 |
|---------|------|
| users | 用户表 |
| groups | 小组表 |
| group_members | 小组成员表 |
| group_activities | 小组动态表 |
| study_records | 学习记录表 |
| study_calendar | 学习日历表 |

创建后，将权限设置为"自定义权限"，并配置：
- **读权限**：所有人可读
- **写权限**：仅创建者可写

### 步骤4：部署云函数

#### 方法1：使用CloudBase CLI（推荐）

在项目根目录执行：

```bash
# 初始化CloudBase项目
cloudbase init

# 选择环境
# 选择空间：默认即可

# 部署所有云函数
cloudbase functions:deploy cloudfunctions
```

#### 方法2：使用控制台手动上传

1. 在CloudBase控制台进入"云函数"页面
2. 点击"新建"
3. 依次上传以下云函数：
   - login
   - createGroup
   - joinGroup
   - getMyGroups
   - getGroupDetail
   - updateMemberStatus
   - uploadStudyRecord
   - getCalendarData

4. 每个云函数需要上传：
   - `index.js`
   - `package.json`
   - 点击"云端安装依赖"

### 步骤5：测试部署

1. 在浏览器中打开 `index.html`
2. 打开浏览器控制台
3. 查看是否有"CloudBase初始化成功"的日志
4. 测试创建小组功能
5. 测试加入小组功能

## 🔧 云函数说明

### 1. login
用户登录，获取用户ID

### 2. createGroup
创建学习小组
- 参数：name, description, maxMembers, userId, userName
- 返回：groupId, joinCode

### 3. joinGroup
加入学习小组
- 参数：joinCode, userId, userName
- 返回：groupId, groupName

### 4. getMyGroups
获取我的小组列表
- 参数：userId
- 返回：groups[]

### 5. getGroupDetail
获取小组详情
- 参数：groupId
- 返回：group, members, activities, ranking

### 6. updateMemberStatus
更新成员学习状态
- 参数：groupId, userId, userName, status, subject
- 返回：success

### 7. uploadStudyRecord
上传学习记录
- 参数：userId, userName, groupId, subject, duration, status
- 返回：success

### 8. getCalendarData
获取日历数据
- 参数：userId, year, month
- 返回：data

## 📊 数据库集合结构

### users（用户表）
```javascript
{
  "_id": "用户ID",
  "openId": "微信openId",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "createTime": "创建时间",
  "lastLoginTime": "最后登录时间",
  "totalStudyTime": 0,
  "currentGroupId": null,
  "status": "offline"
}
```

### groups（小组表）
```javascript
{
  "_id": "小组ID",
  "name": "小组名称",
  "description": "小组描述",
  "ownerId": "创建者ID",
  "ownerName": "创建者名称",
  "joinCode": "邀请码",
  "maxMembers": 10,
  "currentMembers": 1,
  "todayTotalTime": 0,
  "createTime": "创建时间"
}
```

### group_members（小组成员表）
```javascript
{
  "_id": "关系ID",
  "groupId": "小组ID",
  "userId": "用户ID",
  "userName": "用户名称",
  "role": "owner/member",
  "joinTime": "加入时间",
  "todayStudyTime": 0,
  "totalStudyTime": 0,
  "currentStatus": "offline",
  "currentSubject": null,
  "studyStartTime": null,
  "contributionScore": 0
}
```

### group_activities（小组动态表）
```javascript
{
  "_id": "动态ID",
  "groupId": "小组ID",
  "userId": "用户ID",
  "userName": "用户名称",
  "activityType": "join/complete/escape/encourage",
  "activityContent": "动态内容",
  "createTime": "创建时间"
}
```

### study_records（学习记录表）
```javascript
{
  "_id": "记录ID",
  "userId": "用户ID",
  "userName": "用户名称",
  "groupId": "小组ID",
  "subject": "学习科目",
  "duration": 25,
  "status": "complete/escape",
  "startTime": "开始时间",
  "endTime": "结束时间",
  "date": "日期(YYYY-MM-DD)"
}
```

### study_calendar（学习日历表）
```javascript
{
  "_id": "记录ID",
  "userId": "用户ID",
  "date": "日期(YYYY-MM-DD)",
  "totalTime": 0,
  "completeCount": 0,
  "escapeCount": 0,
  "subjects": []
}
```

## ✅ 常见问题

### Q1: CloudBase初始化失败？
**A:** 检查环境ID是否正确，确保CloudBase环境已创建并启动。

### Q2: 云函数调用失败？
**A:**
1. 确保云函数已部署成功
2. 检查云函数是否有语法错误
3. 查看云函数日志获取详细错误信息

### Q3: 数据库权限错误？
**A:** 检查数据库集合的权限设置，确保读写权限配置正确。

### Q4: 免费版有什么限制？
**A:**
- 数据库：2GB
- 云函数：20万次调用/月
- 云存储：5GB
- CDN流量：5GB/月

### Q5: 如何升级到付费版？
**A:** 在CloudBase控制台点击"升级"，选择适合的套餐。

## 📞 技术支持

- CloudBase文档：https://docs.cloudbase.net/
- 腾讯云社区：https://cloud.tencent.com/developer
- 工单支持：在控制台提交工单

## 🎉 部署完成

恭喜！你已经成功部署了CloudBase后端。现在你的"强制执行官"App已经支持：
- ✅ 用户认证
- ✅ 创建学习小组
- ✅ 加入学习小组
- ✅ 实时同步学习状态
- ✅ 小组排行榜
- ✅ 小组动态
- ✅ 学习记录云端存储

开始使用吧！💪
